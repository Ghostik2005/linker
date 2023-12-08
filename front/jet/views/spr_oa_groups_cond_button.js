"use strict";

import { JetView } from "webix-jet";

export default class OaCondButtonView extends JetView {
    config() {
        var button = {
            view: "button",
            localId: "_cond_button",
            value: "ИЛИ",
            width: 50,
            condition: 0,
            on: {
                onItemClick: () => {
                    var button = this.$$("_cond_button");
                    var current_cond = button.config.condition;
                    var new_condition, new_label;
                    if (current_cond == 0) {
                        new_condition = 1;
                        new_label = "И";
                    } else {
                        new_condition = 0;
                        new_label = "ИЛИ";
                    }
                    button.setValue(new_label);
                    button.define({
                        "condition": new_condition,
                        "value": new_label
                    })

                }
            }

        }
        return {
            is_child: true,
            cols: [
                { width: 50 },
                button
            ]
        }
    }

    get_value() {
        var form = this.$$("_cond_button");
        return { "id": form.config.condition, "value": form.config.value }
    }

    set_value(new_value) {
        var button = this.$$("_cond_button");
        var new_condition = new_value.id;
        var new_label = new_value.value;
        button.setValue(new_label);
        button.define({
            "condition": new_condition,
            "value": new_label
        })
    }


    ready() {
    }

    init() {

    }
}
