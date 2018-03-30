#!/usr/bin/env python
# _*_ coding: UTF8 _*_


"""
17. Используйте глобальные временные таблицы для быстрой вставки
Для ускорения вставки и обновления используйте временные таблицы (Global Temporary Table – GTT) для массовых вставок и последующего переноса данных в обычные таблицы.


30. Используйте производные таблицы
Используйте производные таблицы (derived tables) для исключения ненужных сортировок: например, вместо
SELECT r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD,
    r.ID_ORG, r.C_INDEX, r.DT, r.IN_WORK, r.CHANGE_DT, r.SOURCE
FROM PRC r order by r.C_TOVAR DESC

Используйте такой вариант:
SELECT r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD,
    r.ID_ORG, r.C_INDEX, r.DT, r.IN_WORK, r.CHANGE_DT, r.SOURCE
    FROM (SELECT r.SH_PRC as FIELD_KEY FROM prc r ORDER BY r.C_TOVAR DESC) T2
    JOIN PRC r ON r.SH_PRC = T2.FIELD_KEY

"""



from __future__ import division

import sys, os, time, glob, re
import kinterbasdb

WORCDIR = os.path.abspath(os.path.dirname(__file__))
os.chdir(WORCDIR)
#print WORCDIR
import sys, urllib2, hashlib

def _ri(text=">>>"):
    if raw_input(text).split():
        sys.exit(0)

VND_LIST = {
    #28277: [u'Косматея', '5043020515&src'],
#   33877: [u'Лекрус', '5043020515&src'],
    22240: [u'Биофарм', '710400493123&src'],
#   28871: [u'Вектор', '710400493123&src'],
    28177: [u'Пульс-М', '5043020515&src'],
    28178: [u'Пульс-С-Петер', '5043020515&src'],
#   20477: [u'Ориола-Москва', '5077014090&src'],
    29271: [u'Реалинк', '710400493123&src'],
    29977: [u'Форафарм', '5043020515&src'],
    21271: [u'Фармпартнёр', '710400493123&src'],
    20277: [u'Протек-Москва', '710400493123&src'],
    20276: [u'Протек-Ярославль', '710400493123&src'],
    20229: [u'Протек-Архангельск', '710400493123&src'],
    20269: [u'Протек-Тверь', '710400493123&src'],
    20171: [u'Сиа-Тула', '710400493123&src'],
    20177: [u'Сиа-Москва', '710400493123&src'],
    20153: [u'Сиа-Новгород', '710400493123&src'],
    20129: [u'Сиа-Архангельск', '710400493123&src'],
    20176: [u'Сиа-Ярославль', '710400493123&src'],
    20577: [u'Катрен-Москва', '5014010199&src'],
    20557: [u'Катрен-Орел', '710400493123&src'],
    20576: [u'Катрен-Ярославль', '710400493123&src'],
    20471: [u'Морон-Тула', '710400493123&src'],
    20677: [u'Ахолд-Москва', '710400493123&src'],
    20657: [u'Ахолд-Орёл', '710400493123&src'],
    34157: [u'Надежда-Ф', '710400493123&src'],
    20871: [u'Здравсервис', '710400493123&src'],
    20377: [u'Роста', '710400493123&src'],
    20378: [u'Роста-Питер', '710400493123&src'],
    22077: [u'Профитмед', '710400493123&src'],
    24477: [u'Авеста', '710400493123&src'],
    28132: [u'Пульс-Б', '402701797950&src'],
    28176: [u'Пульс-Ярославль', '402701797950&src'],
    23478: [u'Империя', '710400493123&src'],
    20977: [u'Арал', '7105507376&src'],
    30178: [u'БСС', '5725000021&src'],
    30144: [u'БСС(Кострома)', '5725000021&src'],
    30371: [u'СиЭсМедика', '5725000021&src'],
#   33771: [u'М-Сервис', '5725000021&src'],
#   33971: [u'Епихин', '5725000021&src'],
    34371: [u'Бобков', '5725000021&src'],
    40877: [u'Юнифарм', '5725000021&src'],
    40971: [u'Премьер', '5725000021&src'],
    41071: [u'Азбука', '5725000021&src'],
#   34071: [u'Орехов', '5725000021&src'],
    41371: [u'Хозсфера', '5725000021&src'],
    41876: [u'Колорит', '5725000021&src'],
#   37471: [u'Бриз', '5725000021&src'],
#   31871: [u'Белита', '5725000021&src'],
#   37571: [u'Окей', '5725000021&src'],
    30771: [u'Медком', '5725000021&src'],
    34471: [u'Колинз', '5725000021&src'],
    40552: [u'Фармкомплект', '5725000021&src'],
    10000: [u'Забраковка (Ф)', '5725000021&src'],
    20000: [u'Мониторинг(Н)', '5725000021&src'],
    30000: [u'БЕЗ МНН', '5725000021&src'],
    00000: [u'Без поставщика', '5725000021&src'],
    41977: [u'Ирвиндва', '5725000021&src'],
    44735: [u'Хелс(АНТЕЙ)', '5725000021&src'],
    45835: [u'Элли', '5725000021&src'],
    20271: [u'еФарма', '5725000021&src'],
    10001: [u'ситиф', '5725000021&src'],
    41177: [u'Витта', '5725000021&src'],
    45077: [u'Технология здоровья', '5725000021&src'],
    19999: [u'Инвентаризация', '5725000021&src'],
    45277: [u'Фармалайн', '5725000021&src'],
    39377: [u'Комплект сервис', '5725000021&src'],
    45377: [u'Омнимедика', '5725000021&src'],
    45477: [u'Инкос', '5725000021&src'],
    44677: [u'Альфа-М', '5725000021&src'],
    45577: [u'Стелмас', '5725000021&src'],
#   45650: [u'Краснов', '5725000021&src'],
    19998: [u'ФармаСМ', '5725000021&src'],
    19996: [u'Асна', '5725000021&src'],
    19995: [u'Инфоаптека', '5725000021&src'],
    46676: [u'Ярфарма', '5725000021&src'],
    19994: [u'Антей(остатки)', '5725000021&src'],
    19992: [u'еФарма1(остатки)', '5725000021&src'],
    19991: [u'еФарма2(остатки)', '5725000021&src'],
    47369: [u'ТК-Альянс)', '5725000021&src'],
    45177: [u'ЦДК)', '5725000021&src'],
    46869: [u'Максима', '5725000021&src'],
    46769: [u'Новожилова', '5725000021&src'],
    19990: [u'Стандарт-Н', '5725000021&src'],
    40677: [u'Болеар', '5725000021&src'],
    44877: [u'Белла', '5725000021&src'],
    48761: [u'Акцентмед', '5725000021&src'],
    40277: [u'Гранд-Капитал', '5725000021&src'],
    40267: [u'Гранд-Капитал(Смоленск)', '5725000021&src'],
    43136: [u'Норман', '5725000021&src'],
    19989: [u'Остатки(Опора)', '5725000021&src'],
    48929: [u'Сервис(Вологда)', '5725000021&src'],
    48535: [u'Баринов(Вологда)', '5725000021&src'],
    48435: [u'Интро(Вологда)', '5725000021&src'],
    48347: [u'Алиди-Норд(Вологда)', '5725000021&src'],
    19987: [u'М-аптека', '5725000021&src'],
    51066: [u'Регион В', '5725000021&src'],
    19986: [u'Остатки МК', '5725000021&src'],
    51068: [u'МКкомпани(Архангельск)', '5725000021&src'],
    19985: [u'Остатки МК(Юнико)', '5725000021&src'],
    51072: [u'АСНА(поставщик))', '5725000021&src'],
    19984: [u'Остатки Антей(1С-2))', '5725000021&src'],
    49077: [u'Юнити-М', '5725000021&src'],
    51078: [u'РЛС', '5725000021&src'],
    19983: [u'Астра (остатки)', '5725000021&src'],
    52083: [u'Мелодия здоровья', '5725000021&src'],
    19981: [u'Аптека-Лекарь-Ост2', '5725000021&src'],


#   : [u'', '5725000021&src'],
#   31700: [u'ЖНВЛС', '5725000021&src'],
}
db_path = 'localhost/8025:SPR'
#db_path = '82.146.40.211:SPR_TEST'

db = kinterbasdb.connect(dsn=db_path, user='SYSDBA', password='masterkey', \
charset='WIN1251', role='NONE', dialect=3)

#dbc = db.cursor()
#dbc.execute(u"""delete from prc""")
#db.commit()

dbc = db.cursor()
dbc.execute(u"""delete from prc pp
where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
db.commit()

dbc = db.cursor()
dbc.execute(u"""delete from spr_barcode bb where bb.id_spr in (
select b.id_spr from spr_barcode b
left join spr s
on b.id_spr=s.id_spr
where s.id_spr is null)""")
db.commit()


def prc_sync_lnk():

    dbc = db.cursor()
    dbc.execute(u"""select * from PRC where
                    upper(c_tovar) like '%КОШЕК%'
                    or upper(c_tovar) like '%СОБАК%'
                    or upper(c_tovar) like 'R.C.%'
                    or upper(c_tovar) like '%ФРИСКИС%'
                    or upper(c_tovar) like '%КИТИКЕТ%'
                    or upper(c_tovar) like '%ПРОПЛАН%'
                    or upper(c_tovar) like '%ПЕДИГРИ%'
                    or upper(c_tovar) like '%МЕДИУМ СТАРТЕР%'
                    or upper(c_tovar) like '%ГРЫЗУН%'
                    or upper(c_tovar) like '%МЯУДОДЫР%'
                    or upper(c_tovar) like '%КОРМ Д%'
                    or upper(c_tovar) like '%ФЕЛИКС%'
                    or upper(c_tovar) like '%КЭТ ЧАУ%'
                    or upper(c_tovar) like '%ВИСКАС%'
                    or upper(c_tovar) like '%КОТОВ%'
                    or upper(c_tovar) like '%ЖИВОТНЫХ%'
                    or upper(c_tovar) like '%ЩЕНК%'
                    or upper(c_tovar) like '%НАПОЛНИТЕЛЬ%'
                    or upper(c_tovar) like '%ПОРОД%'
                    or upper(c_tovar) like '%ПОРОД%'
                    or upper(c_tovar) like '%КОБЕЛЕЙ%'
                    or upper(c_tovar) like '%КОРМ ДЛЯ%'
                    or upper(c_tovar) like '%БЛОХ%'
                    or upper(c_tovar) like '%ЖИВТНЫ%'
                    or upper(c_tovar) like '%РЫБОК%'
                    or upper(c_tovar) like '%ПТИЦ%'
                    or upper(c_tovar) like '%СВИНКИ%'
                    or upper(c_tovar) like '%УЦЕНКА%'
                    or upper(c_tovar) like '%/НТВ/%'
                    or upper(c_tovar) like '%ГОДЕН%'
                    or upper(c_tovar) like '%СР.ГОД.%'
                    or upper(c_tovar) like '%ОБУВЬ%'
                    or upper(c_tovar) like 'ПОДАРОК%'
                    or upper(c_tovar) like '%МАШИНА%'
                    or upper(c_tovar) like '%АКВАРИУМ%'
                    or upper(c_tovar) like '%АКЦИЯ%'""")
    delrows = dbc.fetchall()
    print "Удалил по признаку -", len(delrows)

#    dbc.execute(u"""update PRC set n_fg=1  where
#                    upper(c_tovar) like '%АКЦИЯ%'""")
#    db.commit()

    dbc.execute(u"""update PRC set n_fg=1, id_org=0 where
                    upper(c_tovar) like '%КОШЕК%'
                    or upper(c_tovar) like '%СОБАК%'
                    or upper(c_tovar) like 'R.C.%'
                    or upper(c_tovar) like '%ФРИСКИС%'
                    or upper(c_tovar) like '%КИТИКЕТ%'
                    or upper(c_tovar) like '%ПРОПЛАН%'
                    or upper(c_tovar) like '%ПЕДИГРИ%'
                    or upper(c_tovar) like '%МЕДИУМ СТАРТЕР%'
                    or upper(c_tovar) like '%ГРЫЗУН%'
                    or upper(c_tovar) like '%МЯУДОДЫР%'
                    or upper(c_tovar) like '%КЭТ ЧАУ%'
                    or upper(c_tovar) like '%КОРМ Д%'
                    or upper(c_tovar) like '%ФЕЛИКС%'
                    or upper(c_tovar) like '%ВИСКАС%'
                    or upper(c_tovar) like '%КОТОВ%'
                    or upper(c_tovar) like '%ЖИВОТНЫХ%'
                    or upper(c_tovar) like '%ЩЕНК%'
                    or upper(c_tovar) like '%НАПОЛНИТЕЛЬ%'
                    or upper(c_tovar) like '%ПОРОД%'
                    or upper(c_tovar) like '%КОБЕЛЕЙ%'
                    or upper(c_tovar) like '%КОРМ ДЛЯ%'
                    or upper(c_tovar) like '%БЛОХ%'
                    or upper(c_tovar) like '%ЖИВТНЫ%'
                    or upper(c_tovar) like '%РЫБОК%'
                    or upper(c_tovar) like '%ПТИЦ%'
                    or upper(c_tovar) like '%СВИНКИ%'
                    or upper(c_tovar) like '%/НТВ/%'
                    or upper(c_tovar) like '%УЦЕНКА%'
                    or upper(c_tovar) like '%/НТВ/%'
                    or upper(c_tovar) like '%ГОДЕН%'
                    or upper(c_tovar) like '%СР.ГОД.%'
                    or upper(c_tovar) like '%ОБУВЬ%'
                    or upper(c_tovar) like 'ПОДАРОК%'
                    or upper(c_tovar) like '%МАШИНА%'
                    or upper(c_tovar) like '%АКВАРИУМ%'
                    or upper(c_tovar) like '%АКЦИЯ%'""")

    db.commit()
    print 'Свожу по кодам'
    dbc.execute(u"""insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT)
    select
      distinct p.sh_prc, l.id_spr, p.id_vnd, p.id_tovar, p.c_tovar, p.c_zavod,
        current_timestamp as dt
        from prc p join lnk l
        on l.id_vnd = p.id_vnd and l.id_tovar = p.id_tovar
        and (select
            count(distinct ll.id_spr)
            from prc pp join lnk ll
            on ll.id_vnd = pp.id_vnd and ll.id_tovar = pp.id_tovar
            where pp.id_vnd = p.id_vnd and pp.id_tovar = p.id_tovar and p.id_tovar<>'' and p.id_tovar is not null and p.id_tovar<>' '
            )=1
           where p.id_vnd in (20269,30144,51066,28178,40267,40277,48929,20129,20378,20229,20276,28176,20576,20176,20153,34157,44735,45277,41977,20577, 20557, 40552, 21271, 29977,22240, 20171, 20277, 20677, 20871, 20377, 22077, 24477, 28162, 28177, 20477, 23478,  20977, 30178, 28132)""")

#Если это не работает, скорее всего в поле  p.id_tovar есть символ % или пусто
#
#            where p.id_vnd in (28132)""")51066,28178,
    db.commit()
    print 'Закончил свдение по кодам'
    #dbc.execute(u"""update prc set id_org=15 where id_vnd=34157 and id_org=0 and n_fg<>15""")
    #db.commit()

    dbc.execute(u"""select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc""")
    rows = dbc.fetchall()
    print "Свёл по коду -", len(rows)
    dbc.execute(u"""delete from prc pp
    where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
    db.commit()

    dbc.execute(u"""update lnk set owner='robot'  where owner is null""")
    db.commit()
    dbc.execute(u"""update prc set id_org = 12 where id_org = 0 and n_fg = 0 and id_vnd<>30000 and id_vnd<>20271 and id_vnd<>44677 and id_vnd<>43136""")
    db.commit()

    dbc.execute(u"""select * from prc where id_org<>12 and  id_org <> 0 and n_fg <> 1  and  n_fg= 0 and n_fg<> 12 and id_vnd in (46676,20269,30144,51066,28178,51072,19987,40267,40277,20129,20378,20229,48761,40677,44877,19990,46769,47369,45177,46869,20276,44735,20576,28176,45835,20176,20153,19992,19996,20657,44677,20177,41177,45277,34157,20471,20557,20171,40552,21271,29977,22240,20171,20277,20677,20871,20377,22077,24477,28162,28177,28132,23478,20977,30178)""")
    rows = dbc.fetchall()
    print "Стасе из накладных -", len(rows)

    dbc.execute(u"""update prc set id_org = 12 where id_org<>12 and  id_org <> 0 and n_fg <> 1  and  n_fg= 0 and n_fg<> 12
                    and id_vnd in
                    (46676,20269,30144,51066,28178,51072,19987,40267,40277,20129,20378,20229,48761,40677,44877,19990,46769,47369,45177,46869,20276,44735,20576,28176,45835,20176,20153,19992,19996,20657,44677,20177,41177,45277,20271,10001,29271,34071,37471,33771,30371,34157,20471,20557,20577,20171,40552,21271,29977,22240,20171,20277,20677,20871,20377,22077,24477,28162,28177,28132,23478,20977,30178)""")
    db.commit()

    #dbc.execute(u"""delete from prc where id_org = 12 and id_vnd = 33971""")
    #db.commit()


    dbc.execute(u"""update prc set id_org=40035 where id_vnd=19994 and id_org=12""")
    db.commit()

    dbc.execute(u"""update prc set id_org=40035 where id_vnd=19985  and id_org=12""")
    db.commit()

#    dbc.execute(u"""update  prc set id_org=16 where sh_prc in (select first 1000 sh_prc from prc where id_vnd=19985 and n_fg<>1 and id_org=40035)""")
#    db.commit()

#    dbc.execute(u"""update prc set id_org=0 where id_org=12""")
#    db.commit()


def genHashOld(id_vnd, tovar, zavod):
    s = u''.join((tovar.replace(u' /ЖНВЛС/', ''), zavod)).upper().replace(',', '.').split()
    s = list(u''.join(s))
    s.sort()
    s = filter(lambda x: ord(x)> 47 , s)
    s = u''.join(s)
    sh_prc = hashlib.md5()
    sh_prc.update(str(id_vnd))
    sh_prc.update(s.encode('1251'))
    return sh_prc.hexdigest()

def genHash(id_vnd, tovar, zavod):
    #print '........genHash......'
    #print id_vnd
    #print tovar
    #print zavod
    s = u''.join((tovar.replace(u' /ЖНВЛС/', ''), zavod)).upper().replace(',', '.').split()
    n = []
    s1 = []
    for x in u''.join(s):
        c = ord(x)
        if c > 57:
            s1.append(x)
        elif c > 47:
            n.append(x)
    #print 's1:', s1
    #print 'n :', n
    s1.sort()
    #print 'ss:', s1
    n.extend(s1)
    #print 'ne:', n
    s = u''.join(n)
    #print '  :', s
    sh_prc = hashlib.md5()
    sh_prc.update(str(id_vnd))
    sh_prc.update(s.encode('1251'))
    buf =  sh_prc.hexdigest()
    #print 'hash:', buf
    return sh_prc.hexdigest()

#print kinterbasdb.paramstyle
#sys.exit()

def load_from_nolink(db):
    global VND_LIST
    if db:
        dbc = db.cursor()
        count_insert = 0
        count_all = 0
        for id_vnd, v in VND_LIST.iteritems():
            for path in glob.glob("/home/plexpert/nolink/price%s*.nolink" % id_vnd):
                #print '[load]', path,
                sys.stdout.flush()
                
                
                count_insert, count_all = _load_from_nolink(db, dbc, id_vnd, v, path, count_insert, count_all)
                print "remove:", path,
                sys.stdout.flush()
                try: 
                    os.remove(path)
                    print "[ OK ]"
                except Excetpion, e:
                    print "[FAIL]", str(e)
                #print '\r[done]'
                sys.stdout.flush()

        print "Добавил в PRC -", count_insert
        print "Всего nolnk - ", count_all


def _load_from_nolink(db, dbc, id_vnd, v, path, count_insert, count_all):
    _re = re.compile("\(..\...\)")
    if True:
        rows = []
        with open(path, 'rb') as f:
            rows = f.read().decode('utf8').splitlines()
        print "--- Всего в этом файле -", len(rows)
        count_all+=len(rows)
        #print rows
        #print rows[0]
        #return
        #url = 'http://plexpert.ru/cgi-bin/price%s.txt.z?%s' % (id_vnd, v[1])
        #f = urllib2.urlopen(url)
        #dt = f.info().dict.get('x-ms71-last-modified', '')
        #print dt
        #print type(dt)
        st = os.stat(path)
        dt = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(st.st_mtime))
        #raw_input('>>>')
        if rows:            
            dbc.execute(u'select dt_prc from VND where id_vnd = %s' % id_vnd)            
            row = dbc.fetchone()
                        
            #if row:                                
            #   dt_cur = row[0]
            #   if dt == dt_cur:
            #       continue 
            
            #sql = u'REPLACE INTO PRC(ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, N_FG, SH_PRC, N_CENA)VALUES(' + str(id_vnd) + ', %s, %s, %s, 0, %s, %s)'
            #sql = u"update PRC set ID_VND=%s, ID_TOVAR=%s, C_TOVAR='%s', C_ZAVOD='%s', N_FG=%s, SH_PRC='%s', N_CENA=%s"
            #sql = u""
            
            c = 0
            #print
            
            for row in rows:
            #for row in f.read().decode('zlib').decode('1251').splitlines():
                #print row
                #continue
                if True:
                    fgCont = False
                    kod, tovar, zavod, idorg, barcode, sh_brak, series, dt_brak = "", "", "", "0", "", "", "", ""
                    try:
                        _, kod, tovar, zavod, idorg, sh_brak, series, dt_brak = row.split('\t')[0:8]
                    except:
                        try:
                            _, kod, tovar, zavod, idorg, barcode = row.split('\t')[0:6]
                            barcode = barcode.strip()
                        except:
                            try:
                                _, kod, tovar, zavod, idorg = row.split('\t')[0:5]
                            except:
                                _, kod, tovar, zavod = row.split('\t')[0:4]
                    try:
                        idorg = int(idorg.strip())
                    except:
                        idorg = 0
                    try:
                        cena = 0
                        if id_vnd == 20171:
                            fgCont = kod.find('/')>-1
                        tovar = tovar.replace(u' /ЖНВЛС/', '')
                    except:
                        #print 'err', row
                        fgCont = True

                    if fgCont: 
                        continue

                    if _re.search(tovar):
                        #print "skip:", tovar
                        sys.stdout.flush()
                        continue

                    try:
                        cena = int(float(cena)*100)
                    except:
                        cena = 0    
                                        
                    # Формируем хеш                 
                    if id_vnd in [28177,28132,28176,28178]:
                        _id_vnd = 28162
                    elif id_vnd in [20577,20576]:
                        _id_vnd = 20557
                    elif id_vnd in [20662]:
                        _id_vnd = 20677
                    elif id_vnd in [20477]:
                        _id_vnd = 20471
                    elif id_vnd in [20177,20153,20176,20129]:
                        _id_vnd = 20171
                    elif id_vnd in [45835,51066]:
                        _id_vnd = 44735
                    elif id_vnd in [20276,20229,20269]:
                        _id_vnd = 20277
                    elif id_vnd in [20378]:
                        _id_vnd = 20377
                    elif id_vnd in [30144]:
                        _id_vnd = 30178
                    #elif id_vnd in [40267]:
                    #   _id_vnd = 40277
                    #   kod = kod.split('_')[0]
                    else:
                        _id_vnd = id_vnd
                    # Добавление забракованных серий
                    if sh_brak and series:
                        sql = "UPDATE OR INSERT INTO BRAK(SH_PRC, SERIES, DT)VALUES(?,?,?)MATCHING(SH_PRC, SERIES);"
                        #print sql
                        #raw_input(">>>")
                        dbc.execute(sql, (sh_brak, series, dt_brak))
                        db.commit()

                    #print _id_vnd
                    #print tovar
                    #print zavod
                    #print '----'
                    try:
                        sh_prc = genHash(_id_vnd, tovar, zavod)
                    except:
                        print 'error genHash', path
                        continue
                    #print sh_prc
                    #print sh_brak
                    #raw_input(">>>")
                    #sys.exit()
                    #print ' ', id_vnd, kod, tovar, zavod, sh_prc                   
                    #ID_VND     ID_TOVAR    C_TOVAR     C_ZAVOD     N_FG    SH_PRC
                    #dbc.execute(u'REPLACE INTO PRC(ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, SH_PRC)VALUES(%s, %s, %s, %s, %s)', (id_vnd, kod, tovar, zavod, sh_prc))
                    if barcode:
                        sql = u"SELECT ID_SPR FROM LNK WHERE SH_PRC='%s'" % (sh_prc)
                        dbc.execute(sql)
                        row = dbc.fetchone()
                        if row:
                            if barcode.isdigit() and len(barcode)==13:
                                print row[0], ";", barcode 
                                sql = """update spr set barcode='%s'where id_spr = %s and barcode is null""" % (barcode, row[0])
                                dbc.execute(sql)
                                db.commit()
                                try:
                                    sql1 = """insert into spr_barcode (barcode, id_spr) values ('%s', %s)""" % (barcode, row[0])
                                    print sql1, "add spr_barcode"
                                    dbc.execute(sql1)
                                    db.commit()
                                except:
                                    continue

                            continue

                    try:
                        dbc.execute(u"SELECT * FROM LNK WHERE SH_PRC='%s'" % (sh_prc))
                        row = dbc.fetchone()
                        #print row
                    except Exception, e:
                        print 'Ошибка2.1', str(e)
                    if row:
                                                #print '---свели---'
                        continue
                    else:
                        if barcode:
                            #print _id_vnd, barcode, tovar, zavod
                            #dbc.execute(u"SELECT ID_SPR, C_TOVAR, C_ZAVOD, C_STRANA FROM SPR WHERE BARCODE='%s'" % (barcode))
                            dbc.execute(u"SELECT ID_SPR, BARCODE FROM SPR_BARCODE WHERE BARCODE='%s'" % (barcode))
                            row = dbc.fetchone()
                            #print row[0], '------', row[1]
                            if row:
                                #print row[0], row[1], " - ".join([row[2], row[3]])
                                dbc.execute(u"""insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)values(?,?,?,?,?,?,current_timestamp, 'barcode')""",
                                (sh_prc, row[0], id_vnd, kod, tovar, zavod))
                                db.commit()
                                #_ri()
                                continue

                        try:
                            #update PRC set ID_VND=20271, ID_TOVAR=5256, C_TOVAR='ГАСТАЛ ТАБ. №30', C_ZAVOD='Pliva Cracow', N_FG=0, SH_PRC='033ebc29d534fa39fafb42d627678970', N_CENA=8877

                            #INSERT INTO PRC (ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, N_FG, SH_PRC, N_CENA) VALUES (NULL, 55, '123123', NULL, NULL, NULL, NULL);
                            #print sql % (str(id_vnd), kod, tovar, zavod, 0, sh_prc, cena)  
                            
                            #dbc.execute(u"select * from PRC_IU(?, ?, ?, ?, ?, ?, ?)", (id_vnd, kod, 0, cena, sh_prc, tovar, zavod))
                            #dbc.callproc("PRC_IU", (id_vnd, kod, 0, cena, sh_prc, tovar, zavod))
                            #print id_vnd,kod,tovar
                            sql = """select sh_prc, c_index from prc where sh_prc='%s'""" %  sh_prc
                            #print sql
                            dbc.execute(sql)
                            row = dbc.fetchone()
                            #print 'row', row
                            if row:
                                tmp = row[1]+1
                                sql = "UPDATE PRC set c_index=%s where sh_prc='%s'" % (tmp, row[0])
                                #print sql
                                dbc.execute(sql)
                                db.commit()
                                #print tmp, '---уже есть в prc---'
                                pass
                            else:
                                #print
                                #print id_vnd, kod, cena, sh_prc, tovar, zavod, idorg
                                sql = """INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work)
VALUES (%s, '%s','%s','%s' , '%s', '%s', '%s', %s)""" % (id_vnd, kod, cena, sh_prc, tovar.replace("'","''"), zavod.replace("'","''"), idorg, -1)
                                dbc.execute(sql)
                                db.commit()
                                #print '---добавил в PRC---'
                                count_insert+=1
#                               outputParams = dbc.fetchone()
                            #print outputParams
                            
                            #for row in dbc.fetchall():
                            #   print 'row:', row
                        except Exception, e:
                            print 'Ошибка2.2' , str(e)  
                            #exit()
                        ###print ' ', tovar
                else:
                    #print row
                    #print row.split('\t')
                    pass
                c+=1
                #if c == 5: break
            db.commit()
            dbc.execute(u'select count(*) from PRC where id_vnd = %s' % id_vnd)
            n_sum = dbc.fetchone()[0]
            #print v[0], dt, n_sum, id_vnd
            try:
                                
                dbc.execute(u"""UPDATE OR INSERT INTO VND (id_vnd, c_vnd, dt_prc, n_sum) VALUES (?, '%s', ?, ?) matching(ID_VND);""" % v[0], (id_vnd, dt, n_sum))
                db.commit()
                return count_insert, count_all
            except Exception, e:
                print v[0], id_vnd, dt, n_sum
                print 'Ошибка3', str(e) 
                return 0, 0
#~ 
load_from_nolink(db)
prc_sync_lnk()
