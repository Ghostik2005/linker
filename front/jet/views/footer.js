"use strict";
import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";

export default class FooterView extends JetView{
    config(){
        let url = this.app.config.r_url + "?getVersion";
        let params = {"user": this.app.config.user};
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        var prod = (res.info.prod) ? "Production" : "test";
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label",
                    label: "Вы находитесь на сервере:  " + location.hostname +  " | fv. " + this.app.config.version + " | bv. " + res.info.version + " | " + prod, css: 'ms-logo-text',
                    height: 32},
                {},
                {view:"button", type: "htmlbutton", width: 32,
                    label: "<span class='webix_icon fa-info', style='color: #666666;'></span>"},
            ]}
        }
    }
