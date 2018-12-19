//"use strict";

import {JetView} from "webix-jet";

export default class BrakSerListView extends JetView{
    config(){

        let view = {view: "list", layout: "x", select: false, scroll: false, height: 32,
            template:"{common.checkBox()} #value#",
            data: [{id: 1, value:'as0as', ch:0}, {id:2, value:'asadsf', ch:1}, {id:3, value:'sdffwerg', ch:0}],
            type:{
                checkBox:function(obj ){
                    return "<span class='check webix_icon fa-"+(obj.ch?"check-":"")+"square-o'></span>";
                }
            },
            onClick:{
                "check":function(e, id){
                    var item = this.getItem(id);
                    item.ch = item.ch?0:1;
                    this.updateItem(id, item);
                }
            },
        }

        return view
    }


}


