"use strict";
import {JetView} from "webix-jet";
//import locals from "../views/local";

export default class footer extends JetView{
    config(){
        return {view: 'toolbar',
            css: 'bottom-bar',
            cols: [
                {view: "label",
                    label: "Вы находитесь на сервере:  " + " saas", //css: 'ms-logo-text',
                    height: 36},
                {},
                {view:"button", id: '__b41', type: 'form',
                    label: "Инфо", width: 56},
            ]}
        }
    }
