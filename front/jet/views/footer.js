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
                {view:"button", id: '__b41', type: 'form',
                    label: "Инфо", width: 56},
            ]}
        }
    }
