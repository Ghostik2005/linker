//
"use strict";
import {JetView} from "webix-jet";
import header from "../views/header";
import footer from "../views/footer";
import center from "../views/body";

export default class StartView extends JetView{
    config() {
        var ui = {
            type:"line",
            id: "main_ui",
            rows: [
                { $subview: header },
                { $subview: center },
                { $subview: footer },
                ],
            };
        return ui;
        }
    init(){
        }
    }
