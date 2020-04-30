"use strict";

export const permited_add = {
    users: ['antey', 'antey1', 'antey2', 'antey3', 'antey4'],
    id_vnds: [45835, 51066]
}

export const screens = {
    LinkerView: "<span class='webix_icon fa-link'></span><span class='multiview-header'>Линкер</span>",
    SkippedBarView: "<span class='webix_icon fa-archive'></span><span class='multiview-header'>Пропущенные</span>",
    AllUnlinkedBarView: "<span class='webix_icon fa-unlink'></span><span class='multiview-header'>Несвязанные</span>",
    LinksBarView: "<span class='webix_icon fa-stumbleupon'></span><span class='multiview-header'>Связки</span>",
    LinksSprBarView: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 16px; font-size: 80%'>Связки:Эталоны</span>",
    AdmBarView: "<span class='webix_icon fa-magic'></span><span class='multiview-header'>Админка</span>",
    BrakBarView: "<span class='webix_icon fa-ban'></span><span class='multiview-header'>Забраковка</span>",
    RefView: "<span class='webix_icon fa-stream'></span><span class='multiview-header'>Справочники</span>",
    SeasonsView: "<span class='webix_icon fa-archive'></span><span class='multiview-header'>Сезоны</span>",
    SprView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Эталоны</span>",
    CountryView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Страны</span>",
    VendorsView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Производители</span>",
    DvView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>ДВ</span>",
    BarcodesView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Штрих-коды</span>",
    GroupsView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Группы</span>",
    HranView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Условия хранения</span>",
    NdsView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>НДС</span>",
    IssueView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Формы выпуска</span>",
    TGroupsView: "<span class='webix_icon fa-list-alt'></span><span class='multiview-header'>Товарные группы</span>",
    SkladUnlinked: "<span class='webix_icon fa-unlink'></span><span class='multiview-header'>Из склада</span>"
}


export const buttons = {
    unFilter: {icon: "./addons/img/unfilter.svg",
               label: "<span class='button_label', style='line-height: 34px'>Сбросить фильтры</span>"},

}

export const options = { 
    sources: [
        {id: '0', value: 'Без источника'}, 
        {id: '1', value: 'PLExpert'}, 
        {id: '2', value: 'Склад'}, 
        {id: '3', value: "Агент"}, 
        {id: '4', value: "edocs"}
    ],
    users: [
        {id: 0, value: "Пользователь"}, 
        {id: 9, value: "Сводильщик"}, 
        {id: 10, value: "Админ"}, 
        {id: 34, value: "Суперадмин"}, 
        {id: 100, value: "Не назначен"}
    ],
    sklad_err_lnk_status: [
        {id: 10, value: "Удалено"},
        {id: 1, value: "Принято"},
        {id: 2, value: "Исправлено"},
        {id: 3, value: "Отклонено"}
    ]
}

export const defaultScreens = [
    {id: 1, value1: "LinkerView", value: "Линкер"},
    {id: 2, value1: "SkippedBarView", value: "Пропущенные"},
    {id: 3, value1: "AllUnlinkedBarView", value: "Несвязанные"},
    {id: 4, value1: "LinksBarView", value: "Связки"},
    {id: 5, value1: "BrakBarView", value: "Забраковка"},
    {id: 6, value1: "SprView", value: "Эталоны"},
]