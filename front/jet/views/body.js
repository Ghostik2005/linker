//"use strict";

import {JetView} from "webix-jet";
import TopmenuView from "../views/top-menu";
import SprView from "../views/spr_dt";

export default class BodyView extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                {$subview: TopmenuView, name: "top_menu"},
                {$subview: SprView, name: "spr_dt"},
                ]
            }
        }
    ready(view) {
        //let user = view.$scope.app.config.user;
        //let u1 = (location.hostname === 'localhost') ? "http://localhost:8080/" : "/linker/";
        //if (user === '') location.href = u1;
        }
    }


