import "./styles/styles.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter, EmptyRouter} from "webix-jet";
import {init_first} from "./views/globals";
import "./locales/ru";

webix.ready( () => {

    webix.i18n.setLocale('ru-RU');

    webix.protoUI({
        name:"activeList"
        },webix.ui.list, webix.ActiveContent);
        
    webix.protoUI({
        name: "cWindow",
        defaults: {
            modal: false,
            move: true,
            position: "center"
            },
        $init: function(config){
            webix.extend(config, {
                head: {
                    view: "toolbar",
                    cols: [
                        {view: "label", label: "Название окна"},
                        {view: "button",
                            type: "icon",
                            icon: "times",
                            css: "times",
                            height: 26,
                            width:26,
                            click: function () {
                                this.getTopParentView().hide();
                                }
                            }
                        ]
                    }
                })
            }
        }, webix.ui.window);

    var app = new JetApp({
        id:             "mainApp",
        name:           "linker",
        version:        "18.061.1645",
        start:          "/login",
        admin:          "34",
        user:           "",
        role:           "0",
        r_url:          (location.hostname === 'localhost') ? "http://saas.local/linker_logic" : "../linker_logic",
        //router:         StoreRouter,
        router:         EmptyRouter,
        x_api:          "x_login",
        debug:          true,
        searchDelay:    1000,
        lch:            0
    });
    
    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );

    app.render();

    //webix.ui.datafilter.customFilterLnkSpr = webix.extend ({
        //render:function(master, config){
            //if (this.init) this.init(config);
            //config.css = "my_filter";
            //return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
            //},
        //_on_key_down:function(e, node, value){
            //var id = this._comp_id;
            //if ((e.which || e.keyCode) == 9) return;
            //if (!checkKey(e.keyCode)) return;
            //if (this._filter_timer) window.clearTimeout(this._filter_timer);
            //this._filter_timer=window.setTimeout(function(){
                //let ui = webix.$$(id);
                //if (ui) {
                    //let params = getDtParams(ui);
                    //get_data({
                        //view: id,
                        //navBar: "__nav_ll",
                        //start: 1,
                        //count: params[1],
                        //searchBar: "_link_search",
                        //method: "getLnkSprs",
                        //field: params[2],
                        //direction: params[3],
                        //filter: params[0]
                        //});
                    //};
                ////if (ui) ui.filterByAll();
                //},webix.ui.datafilter.textWaitDelay);
            //}
        //},  webix.ui.datafilter.textFilter);
    
    init_first(app);
});
