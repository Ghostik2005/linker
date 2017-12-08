"use strict";

import {JetView} from "webix-jet";
import GrCenterView from "../views/gr-center";
import GrLeftView from "../views/gr-left";
import GrRightView from "../views/gr-right";

export default class GrSprView extends JetView{
    config(){
        return {view: "layout",
            //css: 'margin-zero',
            rows: [
                {height: 10},
                {margin: 10,
                    cols:[
                        {$subview: GrRightView, name: "gr_right"},
                        {$subview: GrCenterView, name: "gr_center"},
                        {$subview: GrLeftView, name: "gr_left"},
                        ]
                    }
                ]
            }
        }
    }
