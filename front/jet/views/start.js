"use strict";
import {JetView} from "webix-jet";
import HeaderView from "../views/header";
import FooterView from "../views/footer";

export default class StartView extends JetView{
    config() {
        var ui = {
            type:"line",
            id: "main_ui",
            rows: [
                { $subview: HeaderView },
                { $subview: true},
                { $subview: FooterView },
                ],
            };
        return ui;
        }
    init(){
        }
    }
