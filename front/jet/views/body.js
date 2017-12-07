//"use strict";

import {JetView} from "webix-jet";
import topmenu from "../views/top-menu";
import sprdt from "../views/spr_dt";

export default class body extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                {$subview: topmenu, name: "top_menu"},
                {$subview: sprdt, name: "sprdt"},
                //{template: "qqww"},
                //{$subview: left_col, name: "left_col"},
                //{view: "resizer", width: 5, borderless: true},
                //{template: "qqww"},
                //{$subview: right_col, name: "right_col"},
                //{}
                ]
            }
        }
    ready(view) {
        }
    }


