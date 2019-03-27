"use strict";

import {JetView} from "webix-jet";
import FooterView from "../views/footer";
import SideButtonsBar from "../views/sidebuttons-bar";

export default class TopmenuView extends JetView{
    config(){
        let app = this.app;

        var tabbar = {
            view: "tabbar",
            localId: "_tabbar",
            //borderless: true,
            popupWidth:170,
            tabMinWidth:170,
            tabMoreWidth:70,
            animate: false,
            multiview: true,
            on: {
                onOptionRemove: (id) => {
                    $$(id).destructor();
                },
                onChange: (i, ii) => {
                    
                    let v = this.getRoot().getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1];
                    v = v.$view.childNodes[1].getElementsByClassName('webix_selected')[0];
                    let t = $$(i).$scope.$$("__table");
                    if (t) {
                        v.title = "Всего позиций: " + t.config.totalPos;
                    }
                }
            },
            options: [
                {value: "template", id: "template", close: false, width: 100}
                ]
            };

        var tabmain = {
            view: "multiview",
            css: {"margin-right": "0px !important"},
            vis: false,
            animate: false,
            keepViews:true,
            on: {
                onViewChange: function(old_id, new_id) {
                    // боковая кнопка просмотра эталона
                    // console.log('new_id', new_id);
                    
                    let v;
                    if (old_id === 'app-nav') {
                        v = $$("app-nav").$scope.$$("sideButton").config.formOpen;
                        $$("app-nav").$scope.sideForm.hide_f();
                        $$("app-nav").$scope.$$("sideButton").config.formOpen = false;
                        $$("app-nav").$scope.config.vis = v;
                        };
                    if (new_id === 'app-nav') {
                        v = $$("app-nav").$scope.config.vis;
                        if (v) {
                            $$("app-nav").$scope.$$("sideButton").callEvent("onItemClick");
                            }
                        };
                },
            },
            cells: [
                {template: "template", id: "template"}
            ]
            };

        return {
            cols: [
                {$subview: SideButtonsBar},
                {borderless: !true, rows: [
                    {height: 1},
                    tabbar,
                    tabmain,
                    { $subview: FooterView },
                    ]
                }]
            }
        }

    ready() {

    }

    init() {

    }
}
