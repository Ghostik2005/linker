"use strict";
import {JetView} from "webix-jet";
import HeaderView from "../views/header";
import FooterView from "../views/footer";
import {init_first, request, checkVal} from "../views/globals";

export default class StartView extends JetView{
    config() {
        var ui = {
            type:"line",
            id: "main_ui",
            rows: [
                { $subview: HeaderView },
                { $subview: true},
                { $subview: FooterView },
                ],
            };
        return ui;
        }
    init(){
        let app = this.app;
        let url = app.config.r_url + "?getVersion";
        let params = {"user": app.config.user};
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        app.config.roles = res.cfg;
        app.config.expert = (+res.expert === 5) ? false : true;
        init_first(app);
        }
    }
