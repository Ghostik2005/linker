"use strict";

import {JetView} from "webix-jet";
import {request, deleteCookie, getCookie, onExit} from "../views/globals";

export default class HeaderView extends JetView{
    config(){
        let app = this.app;
        let th = this;

        var view = {view: 'toolbar',
            css: 'realy-header',
            cols: [
                {view: "label", 
                    label: "<a href='http://ms71.org'><span class='ms-logo', style='margin-left: -5px !important; background-image: url(library/img/logo.png);'></span></a>",
                    width: 44, align: 'center', height: 36
                },
                {view: "label", label: "МАНУСКРИПТ-СОЛЮШН: Связки поставщиков | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550
                },
                {},
                {view:"button", type: 'htmlbutton', tooltip: "Выход",
                    label: "<span class='side-icon webix_icon fas fa-sign-out-alt'></span><span class='side-icon', style='line-height: 18px; padding-left: 5px; font-size: smaller'>Выйти</span>",
                    width: 106,
                    on: {
                        onItemClick: () => {
                            // по нажатию кнопки должны возвращаться  склад откуда пришли (при входе запоминаем местоположение)
                            // onExit(app);
                            deleteCookie("merge3-app");
                            //deleteCookie(app.config.sklad_cook); // наверное не удаляем?
                            th.app.config.user = '';
                            th.app.config.x_api = 'x_login';
                            // console.log('tm', app.config.testmode)
                            if (!app.config.testmode) {
                                location.href = "https://sklad71.org/logout";
                            } else {
                                location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/merge3/";
                            }
                        }
                    },
                },
            ]
        }

        return view
    }
    ready() {
    }
}
