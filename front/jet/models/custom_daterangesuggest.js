"use strict";
import "../models/custom_daterange";

webix.protoUI({
    name:"daterangesuggestCustom",
    defaults:{
        type:"daterangeCustom",
        body: {
            view:"daterangeCustom", icons:true, button:true, borderless:true
        }
    },
}, webix.ui.daterangesuggest);
