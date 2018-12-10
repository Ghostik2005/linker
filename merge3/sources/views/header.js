"use strict";

import {JetView} from "webix-jet";
import {request, deleteCookie, getCookie} from "../views/globals";

export default class HeaderView extends JetView{
    config(){
        let app = this.app;
        let th = this;

        var onExit = function () {
            let x;
            let user = getCookie('merge3-app');
            [user, x] = user.split('::');
            let url = app.config.r_url + "?setExit";
            let params = {"user":user};
            request(url, params);
        }

        //window.addEventListener('beforeunload', onExit, false);

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
                    label: "<span class='side-icon webix_icon fas fa-sign-out-alt'></span><span class='side-icon', style='line-height: 16px; padding-left: 5px; font-size: smaller'>Выйти</span>",
                    width: 106,
                    on: {
                        onItemClick: () => {
                            onExit();
                            deleteCookie("merge3-app");
                            th.app.config.user = '';
                            th.app.config.x_api = 'x_login';
                            location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/merge3/";
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
