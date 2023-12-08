"use strict";

import { JetView } from "webix-jet";
import SprOaGroupOaBlockView from "../views/spr_oa_group_db_block";


export default class SprOaGroupView extends JetView {

    constructor(app, data_row) {
        super(app);
        this.preload_data_row = data_row;
    }

    config() {

        var block = {
            is_child: true,
            localId: "_group_oa_block",
            rows: [
                {
                    cols: [
                        { view: "button", value: "(", width: 40, is_save: true },
                    ]
                },
                {
                    cols: [
                        { width: 50 },
                        { "view": "label", width: 100, "label": "Логика в группе" },
                        {
                            view: "button",
                            localId: "_condition",
                            value: "И",
                            width: 50,
                            condition: 1,
                            is_save: true,
                            on: {
                                onItemClick: function () {
                                    var current_cond = this.config.condition;
                                    var new_condition, new_label;
                                    if (current_cond == 0) {
                                        new_condition = 1;
                                        new_label = "И";
                                    } else {
                                        new_condition = 0;
                                        new_label = "ИЛИ";
                                    }
                                    this.setValue(new_label);
                                    this.define({
                                        "condition": new_condition,
                                        "value": new_label
                                    })

                                }
                            }
                        },
                    ]
                },
                {
                    cols: [
                        { width: 50 },
                        {
                            view: "button",
                            value: "Добавить форму выпуска",
                            width: 250,
                            click: () => {
                                this.add_oa_block()
                            },
                        },
                    ]
                },
                {
                    cols: [
                        { view: "button", value: ")", width: 40, is_save: true },
                    ]
                },
            ]
        }
        return block
    }

    get_validate() {
        var valid = true;
        var form = this.$$("_group_oa_block");
        var childs = form.getChildViews();
        childs.forEach((child) => {
            if (child.config.is_child) {
                if (child.hasOwnProperty("$scope") && typeof child.$scope.get_validate !== 'undefined') {
                    valid = child.$scope.get_validate();
                }
            }
        })
        return valid;
    }

    get_value() {
        var results = [{ "id": undefined, "value": "(" }];
        results.push(
            { "id": this.$$("_condition").config.condition, "value": this.$$("_condition").config.value }
        );
        var form = this.$$("_group_oa_block");
        var childs = form.getChildViews();
        childs.forEach((child) => {
            if (child.config.is_child) {
                if (child.hasOwnProperty("$scope") && typeof child.$scope.get_value !== 'undefined') {
                    var child_value = child.$scope.get_value();
                    results.push(child_value);
                }
            }
        })
        results.push({ "id": undefined, "value": ")" });
        return results;
    }

    remove_oa_block(view_id) {
        var form = this.$$("_group_oa_block");
        var childs = form.getChildViews()
        if (childs.length > 5) {
            form.removeView(view_id);
        }
    }

    add_oa_block(data_row) {
        var form = this.$$("_group_oa_block")
        var childs = form.getChildViews();
        form.addView(new SprOaGroupOaBlockView(this.app, data_row), childs.length - 2);
    }

    add_preload_oa_blocks() {
        this.preload_data_row.forEach((row) => {
            if (row.hasOwnProperty("id")) {
                if (["И", "ИЛИ"].includes(row.value)) {
                    var cond_button = this.$$("_condition")
                    cond_button.setValue(row.value)
                    cond_button.config.condition = row.id
                } else {
                    this.add_oa_block(row)
                }
            }
        })

    }

    ready() {
        if (this.preload_data_row) {
            this.add_preload_oa_blocks();
        } else {
            this.add_oa_block();
        }
    }

    init() {
    }
}
