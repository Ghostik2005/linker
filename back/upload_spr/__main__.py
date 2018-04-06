#coding: utf-8


"""


сведение по баркоду: к какому баркоду привязывается товар, если существуют несколько одинаковых? к первому попавшемуся? судя по скрипту к первому...

сведение по баркоду: но если один штрихкод привязан к нескольким товарам, то не выполнится - пропукаем такие товары, отпраяляя их на ручное сведение



вместо
SELECT r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD,
    r.ID_ORG, r.C_INDEX, r.DT, r.IN_WORK, r.CHANGE_DT, r.SOURCE
FROM PRC r order by r.C_TOVAR DESC

используем
SELECT r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD,
    r.ID_ORG, r.C_INDEX, r.DT, r.IN_WORK, r.CHANGE_DT, r.SOURCE
    FROM (SELECT r.SH_PRC as FIELD_KEY FROM prc r ORDER BY r.C_TOVAR DESC) T2
    JOIN PRC r ON r.SH_PRC = T2.FIELD_KEY

"""



import sys, os, time, glob, re, traceback
try:
    import libs.fdb as fdb
except ImportError:
    import fdb

WORCDIR = os.path.abspath(os.path.dirname(__file__))
os.chdir(WORCDIR)
import hashlib


VND_LIST = {
    #28277: [u'Косматея', '5043020515&src'],
#   33877: [u'Лекрус', '5043020515&src'],
    22240: [u'Биофарм', '710400493123&src'],
    28871: [u'Вектор', '710400493123&src'], ############
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
#    33771: [u'М-Сервис', '5725000021&src'],
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
    }

db_path = 'localhost/8025:spr'
#db_path = '82.146.40.211:SPR_TEST'


db = fdb.connect(**{
                "host": "localhost",
                "database": "spr",
                "user": 'SYSDBA',
                "password":'masterkey',
                "charset" : 'WIN1251'
                })


def erase_prc():
    #очищаем PRC если такие ключи есть в LNK
    dbc = db.cursor()
    dbc.execute(u"""delete from prc pp
    where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
    db.commit()
    #удаляем из spr_barcode позиции, которых нет в SPR
    dbc = db.cursor()
    dbc.execute(u"""delete from spr_barcode bb where bb.id_spr in (
    select b.id_spr from spr_barcode b
    left join spr s
    on b.id_spr=s.id_spr
    where s.id_spr is null)""")
    db.commit()
    

def prc_sync_lnk():
    erase_prc()
    dbc = db.cursor()
    sql = u"""select count(*) FROM (
    select c_tovar from PRC where
     c_tovar  CONTAINING 'КОШЕК'
    or  c_tovar  CONTAINING 'СОБАК'
    or upper(c_tovar) like 'R.C.%'
    or  c_tovar  CONTAINING 'ФРИСКИС'
    or  c_tovar  CONTAINING 'КИТИКЕТ'
    or  c_tovar  CONTAINING 'ПРОПЛАН'
    or  c_tovar  CONTAINING 'ПЕДИГРИ'
    or  c_tovar  CONTAINING 'МЕДИУМ СТАРТЕР'
    or  c_tovar  CONTAINING 'ГРЫЗУН'
    or  c_tovar  CONTAINING 'МЯУДОДЫР'
    or  c_tovar  CONTAINING 'КОРМ Д'
    or  c_tovar  CONTAINING 'ФЕЛИКС'
    or  c_tovar  CONTAINING 'КЭТ ЧАУ'
    or  c_tovar  CONTAINING 'ВИСКАС'
    or  c_tovar  CONTAINING 'КОТОВ'
    or  c_tovar  CONTAINING 'ЖИВОТНЫХ'
    or  c_tovar  CONTAINING 'ЩЕНК'
    or  c_tovar  CONTAINING 'НАПОЛНИТЕЛЬ'
    or  c_tovar  CONTAINING 'ПОРОД'
    or  c_tovar  CONTAINING 'ПОРОД'
    or  c_tovar  CONTAINING 'КОБЕЛЕЙ'
    or  c_tovar  CONTAINING 'КОРМ ДЛЯ'
    or  c_tovar  CONTAINING 'БЛОХ'
    or  c_tovar  CONTAINING 'ЖИВТНЫ'
    or  c_tovar  CONTAINING 'РЫБОК'
    or  c_tovar  CONTAINING 'ПТИЦ'
    or  c_tovar  CONTAINING 'СВИНКИ'
    or  c_tovar  CONTAINING 'УЦЕНКА'
    or  c_tovar  CONTAINING '/НТВ/'
    or  c_tovar  CONTAINING 'ГОДЕН'
    or  c_tovar  CONTAINING 'СР.ГОД.'
    or  c_tovar  CONTAINING 'ОБУВЬ'
    or upper(c_tovar) like 'ПОДАРОК%'
    or  c_tovar  CONTAINING 'МАШИНА'
    or  c_tovar  CONTAINING 'АКВАРИУМ'
    or  c_tovar  CONTAINING 'АКЦИЯ'
    and n_fg!=1 and id_org!=0)"""
    #dbc.execute(sql)
    #delrows = dbc.fetchone()
    #print("Удаляем по признаку -", delrows[0])
    print("Удаляем по признаку")
    
    dbc.execute(u"""update PRC set n_fg=1, id_org=0
where n_fg!=1
and 
(   c_tovar CONTAINING 'КОШЕК'
or  c_tovar CONTAINING 'СОБАК'
or  upper(c_tovar) like 'R.C.%'
or  c_tovar CONTAINING 'ФРИСКИС'
or  c_tovar CONTAINING 'КИТИКЕТ'
or  c_tovar CONTAINING 'ПРОПЛАН'
or  c_tovar CONTAINING 'ПЕДИГРИ'
or  c_tovar CONTAINING 'МЕДИУМ СТАРТЕР'
or  c_tovar CONTAINING 'ГРЫЗУН'
or  c_tovar CONTAINING 'МЯУДОДЫР'
or  c_tovar CONTAINING 'КЭТ ЧАУ'
or  c_tovar CONTAINING 'КОРМ Д'
or  c_tovar CONTAINING 'ФЕЛИКС'
or  c_tovar CONTAINING 'ВИСКАС'
or  c_tovar CONTAINING 'КОТОВ'
or  c_tovar CONTAINING 'ЖИВОТНЫХ'
or  c_tovar CONTAINING 'ЩЕНК'
or  c_tovar CONTAINING 'НАПОЛНИТЕЛЬ'
or  c_tovar CONTAINING 'ПОРОД'
or  c_tovar CONTAINING 'КОБЕЛЕЙ'
or  c_tovar CONTAINING 'КОРМ ДЛЯ'
or  c_tovar CONTAINING 'БЛОХ'
or  c_tovar CONTAINING 'ЖИВТНЫ'
or  c_tovar CONTAINING 'РЫБОК'
or  c_tovar CONTAINING 'ПТИЦ'
or  c_tovar CONTAINING 'СВИНКИ'
or  c_tovar CONTAINING '/НТВ/'
or  c_tovar CONTAINING 'УЦЕНКА'
or  c_tovar CONTAINING 'ГОДЕН'
or  c_tovar CONTAINING 'СР.ГОД.'
or  c_tovar CONTAINING 'ОБУВЬ'
or  upper(c_tovar) like 'ПОДАРОК%'
or  c_tovar CONTAINING 'МАШИНА'
or  c_tovar CONTAINING 'АКВАРИУМ'
or  c_tovar CONTAINING 'АКЦИЯ'
)
""")
    db.commit()
    print('Свожу по кодам')
    sql = """insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
select DISTINCT p.sh_prc, l.id_spr, p.id_vnd, p.id_tovar, p.c_tovar, p.c_zavod, current_timestamp, 'robot'
from prc p 
join lnk l on l.id_vnd = p.id_vnd and l.id_tovar = p.id_tovar and p.id_tovar<>'' and p.id_tovar is not null and p.id_tovar<>' '
    and (select count(distinct ll.id_spr) as ccc
        from prc pp
        join lnk ll on ll.id_vnd = pp.id_vnd and ll.id_tovar = pp.id_tovar
        where pp.id_vnd = p.id_vnd and pp.id_tovar = p.id_tovar
        ) = 1 
where p.id_vnd in (20269,30144,51066,28178,40267,40277,48929,20129,20378,20229,20276,28176,20576,20176,20153,34157,44735,45277,41977,20577, 20557, 40552, 21271, 29977,22240, 20171, 20277, 20677, 20871, 20377, 22077, 24477, 28162, 28177, 20477, 23478,  20977, 30178, 28132)
    """
    dbc.execute(sql)
    dbc.execute(u"""delete from prc pp where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
    db.commit()
    print('Закончил сведение по кодам')

    dbc.execute(u"""update prc set id_org = 12 where id_org = 0 and n_fg = 0 and id_vnd<>30000 and id_vnd<>20271 and id_vnd<>44677 and id_vnd<>43136""")
    db.commit()

    #dbc.execute(u"""select count(*) from prc where id_org<>12 and  id_org <> 0 and n_fg <> 1  and  n_fg= 0 and n_fg<> 12
    #and id_vnd in (46676,20269,30144,51066,28178,51072,19987,40267,40277,20129,20378,20229,48761,40677,44877,19990,46769,47369,45177,46869,20276,44735,20576,28176,45835,20176,20153,19992,19996,20657,44677,20177,41177,45277,20271,10001,29271,34071,37471,33771,30371,34157,20471,20557,20577,20171,40552,21271,29977,22240,20171,20277,20677,20871,20377,22077,24477,28162,28177,28132,23478,20977,30178)""")
    #rows = dbc.fetchone()
    #print("Стасе из накладных -", rows[0])

    dbc.execute(u"""update prc set id_org = 12 where id_org<>12 and  id_org <> 0 and n_fg <> 1  and  n_fg= 0 and n_fg<> 12
and id_vnd in (46676,20269,30144,51066,28178,51072,19987,40267,40277,20129,20378,20229,48761,40677,44877,19990,46769,47369,45177,46869,20276,44735,20576,28176,45835,20176,20153,19992,19996,20657,44677,20177,41177,45277,20271,10001,29271,34071,37471,33771,30371,34157,20471,20557,20577,20171,40552,21271,29977,22240,20171,20277,20677,20871,20377,22077,24477,28162,28177,28132,23478,20977,30178)""")
    db.commit()

    dbc.execute(u"""update prc set id_org=40035 where id_vnd=19994 and id_org=12""")
    db.commit()

    dbc.execute(u"""update prc set id_org=40035 where id_vnd=19985  and id_org=12""")
    db.commit()

def genHash(id_vnd, tovar, zavod):
    s = u''.join((tovar.replace(u' /ЖНВЛС/', ''), zavod)).upper().replace(',', '.').split()
    n = []
    s1 = []
    for x in u''.join(s):
        c = ord(x)
        if c > 57:
            s1.append(x)
        elif c > 47:
            n.append(x)
    s1.sort()
    n.extend(s1)
    s = u''.join(n)
    sh_prc = hashlib.md5()
    sh_prc.update(str(id_vnd).encode())
    sh_prc.update(s.encode('1251'))
    buf =  sh_prc.hexdigest()
    return sh_prc.hexdigest()

def load_from_nolink(db):
    global VND_LIST
    if db:
        dbc = db.cursor()
        count_insert = 0
        count_all = 0
        for id_vnd, v in VND_LIST.items():
            for path in glob.glob(os.path.join(WORCDIR, "price%s*.nolink" % id_vnd)):
                count_insert, count_all = _upload_to_db(db, dbc, id_vnd, v, path, count_insert, count_all)
                print("remove:", path, flush=True)
                try: 
                    os.remove(path)
                    print("[ OK ]", flush=True)
                except Exception as e:
                    print("[FAIL]", str(e), flush=True)
        print("Добавил в PRC -", count_insert, flush=True)
        print("Всего nolnk - ", count_all, flush=True)


def _upload_to_db(db, dbc, id_vnd, v, path, count_insert, count_all):
    _re = re.compile("\(..\...\)")
    rows = []
    with open(path, 'rb') as f:
        rows = f.read()
    rows = rows.decode('utf8').splitlines()
    print("--- Всего в этом файле -", len(rows))
    count_all+=len(rows)
    ret = []
    if rows:
        c = 0
        ins_params = []
        for row in rows:
            fgCont = False
            kod, tovar, zavod, idorg, barcode, sh_brak, series, dt_brak = "", "", "", "0", None, "", "", ""
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
                fgCont = True
            if fgCont: 
                continue
            if _re.search(tovar):
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
            else:
                _id_vnd = id_vnd
            # Добавление забракованных серий
            if sh_brak and series:
                #print('-'*20)
                print('забраковка: ', sh_brak, series)
                sql = "UPDATE OR INSERT INTO BRAK(SH_PRC, SERIES, DT)VALUES(?,?,?) MATCHING(SH_PRC, SERIES)"
                dbc.execute(sql, (sh_brak, series, dt_brak))
                db.commit()
            try:
                sh_prc = genHash(_id_vnd, tovar, zavod)
            except Exception as Err:
                continue
            barcode = barcode if barcode else None
            source = 1 if len(os.path.basename(path)) < 20 else 2 #1 - прайслистэксперт, 2 - склад
            inss = (id_vnd, kod, cena, sh_prc, tovar.replace("'","''"), zavod.replace("'","''"), idorg, source, barcode)
            ins_params.append(inss)
        sql = """UPDATE or INSERT INTO A_TEMP_PRC (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, source, barcode)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"""
        if len(ins_params) > 0:
            dbc.executemany(sql, ins_params)
            db.commit()
            for row in getGen(dbc, "SELECT sh_prc, barcode FROM A_TEMP_PRC WHERE barcode is NOT NULL"):
                dbc.execute("SELECT l.ID_SPR FROM LNK l WHERE l.SH_PRC = ?", (row[0],))
                ret = dbc.fetchone()
                if ret:
                    dbc.execute("UPDATE spr set barcode = ? where id_spr = ? and barcode is null", (row[1], ret[0]))
                    dbc.execute("UPDATE or INSERT INTO spr_barcode (barcode, id_spr) values (?, ?) MATCHING (barcode, id_spr)", (row[1], ret[0]))
            dbc.execute("""DELETE FROM A_TEMP_PRC WHERE sh_prc in 
(SELECT r.SH_PRC FROM A_TEMP_PRC r
    JOIN LNK l on l.SH_PRC = r.SH_PRC)""")
            dbc.execute("""  UPDATE PRC SET PRC.C_INDEX = PRC.C_INDEX + 1
WHERE PRC.SH_PRC in ( SELECT r.SH_PRC FROM PRC r
    WHERE EXISTS (SELECT p.SH_PRC FROM A_TEMP_PRC p
           WHERE p.SH_PRC = r.SH_PRC) )""")
            dbc.execute("""DELETE FROM A_TEMP_PRC WHERE SH_PRC in (
SELECT r.SH_PRC FROM PRC r WHERE EXISTS (
    SELECT p.SH_PRC FROM A_TEMP_PRC p
    WHERE p.SH_PRC = r.SH_PRC))""")
            for row in getGen(dbc, """    SELECT r.sh_prc FROM A_TEMP_PRC r 
JOIN (select rr.BARCODE bc, count(rr.BARCODE) cbc FROM A_TEMP_PRC rr
    JOIN SPR_BARCODE s on s.BARCODE = rr.BARCODE
    where rr.BARCODE is NOT NULL GROUP by rr.BARCODE HAVING COUNT(rr.BARCODE) > 1) on bc = r.BARCODE"""):
                dbc.execute("""INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source)
SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source
FROM A_TEMP_PRC r where r.SH_PRC = ?""", (row[0],))
                dbc.execute("""DELETE FROM A_TEMP_PRC WHERE SH_PRC = ?""", (row[0],))
            dbc.execute("""INSERT INTO lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
select r.SH_PRC, s.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, CURRENT_TIMESTAMP, 'barcode'
FROM A_TEMP_PRC r JOIN SPR_BARCODE s on s.BARCODE = r.BARCODE""")
            dbc.execute("""DELETE FROM A_TEMP_PRC a WHERE a.SH_PRC in (
select r.SH_PRC FROM A_TEMP_PRC r JOIN SPR_BARCODE s on s.BARCODE = r.BARCODE) """)
            dbc.execute("""SELECT COUNT(*) FROM A_TEMP_PRC""")
            count_i = dbc.fetchone()[0]
            dbc.execute("""INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source)
SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source
FROM A_TEMP_PRC r """)
            dbc.execute("""DELETE FROM A_TEMP_PRC""")
            
            #dbc.execute('SELECT p.TOT, p.TOT_INS FROM A_T_PR p')
            #dbc.execute('SELECT p.TOT, p.TOT_INS FROM QWE p')
            #ret = dbc.fetchone()
            
            db.commit()
            #res=ret
            #count_insert += res[1]
            count_insert += count_i
    return count_insert, count_all

def getGen(dbc, sql):
    dbc.execute(sql)
    ret = dbc.fetchall()
    for row in ret:
        yield row


if "__main__" == __name__:
    #erase_prc()
    t1 = time.time()
    load_from_nolink(db)
    t2 = time.time()
    prc_sync_lnk()
    db.close()
    print('upload time', t2 - t1)
    print('sync time', time.time() - t2)
