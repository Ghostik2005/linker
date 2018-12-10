"use strict";
import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";

export default class FooterView extends JetView{
    config(){
        let url = this.app.config.r_url + "?getVersion";
        let params = {"user": this.app.config.user};
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');

        //var res = {'info': {'prod': false, 'version': '1'}};

        this.app.config.adm = res.adm;

        var prod = (res.prod) ? "Production" : "test";

        var view = {view: 'toolbar',
            css: 'realy-header',
            cols: [
                {view: "label",
                    label: "Вы находитесь на сервере:  " + location.hostname +  " | fv. " + this.app.config.version + " | bv. " + res.version + " | " + prod,
                    css: {"color": "#404040 !important", "font-size": "11px !important"},
                    height: 12
                },
                {},
                {view:"button", type: "htmlbutton", width: 32, hidden: true,
                    label: "<span class='webix_icon fa-info', style='color: #666666;'></span>"
                },
            ]
        }

        return view
    }
}
