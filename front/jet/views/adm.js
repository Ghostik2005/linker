//"use strict";

import {JetView} from "webix-jet";
import AdmTopMenuView from "../views/adm-top-menu";
//import SprView from "../views/spr_dt";

export default class AdmView extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                {$subview: AdmTopMenuView, name: "top_menu"},
                {$subview: true},
                ]
            }
        }
    ready(view) {
        }
    }


