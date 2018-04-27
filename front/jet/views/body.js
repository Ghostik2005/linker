"use strict";

import {JetView} from "webix-jet";
import TopmenuView from "../views/top-menu";

export default class BodyView extends JetView{
    config(){
        return {view: "layout",
            css: 'margin-zero',
            rows:[
                {$subview: TopmenuView, name: "top_menu"},

                ]
            }
        }
    }


