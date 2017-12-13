"use strict";
import {JetView} from "webix-jet";
//import locals from "../views/local";

export default class FooterView extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label",
                    label: "Вы находитесь на сервере:  " + " saas", css: 'ms-logo-text',
                    height: 36},
                {},
                {view:"button", type: "htmlbutton", width: 32,
                    label: "<span class='webix_icon fa-info', style='color: #666666;'></span>"},
            ]}
        }
    }
