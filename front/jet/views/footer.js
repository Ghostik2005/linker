"use strict";
import {JetView} from "webix-jet";
import {request} from "../views/globals";

export default class FooterView extends JetView{
    config(){
        let url = this.app.config.r_url + "?getVersion";
        let params = {"user": this.app.config.user};
        var v = JSON.parse(request(url, params, !0).response);
        var prod = (v.prod) ? "Production" : "test";

        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label",
                    label: "Вы находитесь на сервере:  " + location.hostname +  " | fv. " + this.app.config.version + " | bv. " + v.ret_val + " | " + prod, css: 'ms-logo-text',
                    height: 36},
                {},
                {view:"button", type: "htmlbutton", width: 32,
                    label: "<span class='webix_icon fa-info', style='color: #666666;'></span>"},
            ]}
        }
    }
