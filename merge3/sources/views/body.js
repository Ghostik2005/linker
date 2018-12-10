"use strict";

import {JetView} from "webix-jet";
import FooterView from "../views/footer";
import SideButtonsBar from "../views/sidebuttons-bar";
import MainTabView from "../views/main_tab"

export default class BodyView extends JetView{
    config(){

        var view = {view: "layout",
            //borderless: true,
            cols: [
                {$subview: SideButtonsBar},
                {borderless: true, 
                    rows: [
                    //{height: 10},
                    {$subview: MainTabView},
                    {$subview: FooterView},
                    ]
                }
            ]
        }
        
        return view
    }
}


