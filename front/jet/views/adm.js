//"use strict";

import {JetView} from "webix-jet";
import AdmTopMenuView from "../views/adm-top-menu";
import {get_refs} from "../views/globals";

export default class AdmView extends JetView{
    config(){
        return {view: "layout",
            //css: 'margin-zero',
            rows:[
                {$subview: AdmTopMenuView, name: "top_menu"},
                {$subview: true},
                ]
            }
        }
    ready(view) {
        }
    init() {
        let app = this.app;
        let delay = app.config.searchDelay;
        setTimeout(get_refs, 0*delay, {"app": app, "type": "async", "method": "getRoles", "store": "roles_dc"});
        setTimeout(get_refs, 0*delay, {"app": app, "type": "async", "method": "getUsersAll", "store": "users_dc"});
        }
    }


