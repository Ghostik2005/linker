"use strict";

import { JetView } from "webix-jet";
import { allIs, oa_filter } from "../views/globals";

export default class SprOaGroupOaBlockView extends JetView {

    constructor(app, data_row) {
        super(app);
        this.preload_data_row = data_row;
    }

    config() {
        let th = this;

        var block = {
            is_child: true,
            localId: "_button_block",
            rules: {
                "id_oa": webix.rules.isNotEmpty,
            },
            cols: [
                { width: 50 },
                {
                    view: "combo",
                    localId: "_oa_combo",
                    label: "",
                    is_save: true,
                    value: "",
                    name: "id_oa",
                    required: true,
                    options: {
                        filter: oa_filter,
                        body: {
                            autoheight: false,
                            view: "list",
                            type: { height: "auto", width: "auto" },
                            template: "<div class='comboList'>#c_issue#</div>",
                            height: 200,
                            yCount: 0,
                            //data: dv
                        }
                    },
                    on: {
                        onAfterRender: function () {
                            this.getList().sync(allIs);
                            if (th.preload_data_row) {
                                this.setValue(th.preload_data_row.id);
                            }

                        }
                    },
                },
                {
                    view: "button",
                    value: "X",
                    width: 40,
                    click: () => {
                        this.remove_block()
                    }
                },
            ]

        }

        return block
    }

    get_validate() {
        var form = this.$$("_oa_combo");
        var valid = form.validate({ hidden: false, disabled: false });
        return valid;
    }

    get_value() {
        var form = this.$$("_oa_combo");
        return { "id": form.getValue(), "value": form.getText() }
    }

    remove_block() {
        let pv = this.getParentView();
        pv.remove_oa_block(this.$$("_button_block").config.id)
    }

    ready() {
    }

    init() {
    }
}
