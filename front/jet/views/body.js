//"use strict";

import {JetView} from "webix-jet";
import TopmenuView from "../views/top-menu";
import SprView from "../views/spr_dt";

export default class BodyView extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            id: "__body",
            rows:[
                {$subview: TopmenuView, name: "top_menu"},
                {$subview: SprView, name: "spr_dt"},
                ]
            }
        }
    ready(view) {

        }
    }


