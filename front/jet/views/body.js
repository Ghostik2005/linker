//"use strict";

import {JetView} from "webix-jet";
//import left_col from "../views/left";
//import right_col from "../views/right";

export default class center extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                //{},
                {template: "qqww"},
                //{$subview: left_col, name: "left_col"},
                {view: "resizer", width: 5, borderless: true},
                {template: "qqww"},
                //{$subview: right_col, name: "right_col"},
                //{}
                ]
            }
        }
    ready(view) {
        }
    }


