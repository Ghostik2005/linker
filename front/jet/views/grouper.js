//"use strict";

import {JetView} from "webix-jet";
import TopmenuView from "../views/top-menu";
import GrTopView from "../views/gr-top";
import GrSprView from "../views/gr-body";

export default class GrouperView extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                {$subview: GrTopView, name: "gr_top"},
                {$subview: GrSprView, name: "gr_spr"},
                ]
            }
        }
    ready(view) {
        }
    }


