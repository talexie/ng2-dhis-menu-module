import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as fromConstants from '../constants';
import { BehaviorSubject, forkJoin } from 'rxjs/index';

@Injectable()
export class MenuService {
  private _menuModules$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  constructor(private httpClient: HttpClient) {}

  getSystemSettings(rootUrl: string): Observable<any> {
    return Observable.create(observer => {
      forkJoin(this.httpClient.get(rootUrl + 'api/systemSettings.json'), this.httpClient.get(rootUrl + 'api/system/info.json')).subscribe(
        (settings: any[]) => {
          observer.next({...settings[0], ...settings[1]});
          observer.complete();
        },
        () => observer.error(null)
      );
    });
  }

  getMenuModules(rootUrl: string): Observable<any> {
    return Observable.create(observer => {
      this.httpClient
        .get(rootUrl + 'dhis-web-commons/menu/getModules.action')
        .subscribe(
          (menuModuleResult: any) => {
            const sanitizedMenu = this._sanitizeMenuItems(menuModuleResult.modules, rootUrl);
            this._menuModules$.next(sanitizedMenu)
            observer.next(
              sanitizedMenu
            );
            observer.complete();
          },
          () => {
            observer.next(null);
            observer.complete();
          }
        );
    });
  }

  getSanitizedMenus() {
    return this._menuModules$.asObservable();
  }

  getUserInfo(rootUrl: string): Observable<any> {
    return Observable.create(observer => {
      this.httpClient.get(rootUrl + 'api/me.json').subscribe(
        (userInfo: any) => {
          observer.next(userInfo);
          observer.complete();
        },
        () => {
          observer.next(null);
          observer.complete();
        }
      );
    });
  }

  private _sanitizeMenuItems(menuItems: any[], rootUrl: string): any {
    const sanitizedMenuItems = menuItems.map((item: any) => {
      const newItem: any = { ...item };
      if (
        !newItem.hasOwnProperty('displayName') ||
        newItem.displayName === ''
      ) {
        newItem.displayName = newItem.name;
      }

      if (newItem.defaultAction.indexOf('http') === -1) {
        newItem.defaultAction = '../../' + newItem.defaultAction;
      }

      if (newItem.icon.indexOf('http') === -1) {
        newItem.icon = '../../' + newItem.icon;
      }

      newItem.onlyShowOnSearch = false;

      return newItem;
    });

    const predefinedMenuItems = fromConstants.PREDEFINED_MENU_ITEMS.map(
      (item: any) => {
        const newItem: any = { ...item };

        if (newItem.defaultAction) {
          newItem.defaultAction = rootUrl + newItem.defaultAction;
        }

        if (newItem.icon) {
          newItem.icon = rootUrl + newItem.icon;
        }
        return newItem;
      }
    );
    return [...sanitizedMenuItems, ...predefinedMenuItems];
  }
}
