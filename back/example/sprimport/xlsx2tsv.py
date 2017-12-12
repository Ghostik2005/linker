#!/usr/bin/env python

import xml.etree.ElementTree as ET
import os,sys,zipfile,re,itertools

def load(flname):
    def myjoin(seq, sep=" "):
        return sep.join(str(x) for x in seq)
        
    args = [flname, 1]#sys.argv[:]

    if args:
        z = zipfile.ZipFile(args.pop(0))
    elif not sys.stdin.isatty():
        z = zipfile.ZipFile(sys.stdin)
    else:
        return None, __doc__.strip()
        

    n=lambda x: "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}%s" % x
    sheet_filenames = [f for f in z.namelist() if re.search("^xl/worksheets/sheet.*xml$", f)]
    workbook_x = ET.XML(z.read("xl/workbook.xml"))
    sheet_xs = workbook_x.find(n("sheets")).findall(n("sheet"))

    def sheet_report(sheet_xs):
       # global sheet_xs
        data = ["Sheets in this file:"]
        for i,x in enumerate(sheet_xs):
            data.append( "%3d: %s" % (i+1, x.get('name')) )
        return sys.stderr, "\n".join(data)  

    def sheet_error(msg):
        print>>sys.stderr, msg
        sheet_report(sheet_xs)
    
    
    if not args and len(sheet_filenames) > 1:
        sheet_error("There are multiple sheets -- need to specify a sheet number or name.")
    elif not args and len(sheet_filenames) == 1:
        sheet_num = 1
    elif args:
        sheet_num = args.pop(0)

    if isinstance(sheet_num,str) and (not re.search('^[0-9]+$',sheet_num) or int(sheet_num) > len(sheet_filenames)):
        name = sheet_num
        inds = [i for i,x in enumerate(sheet_xs)  if x.get('name')==name]
        if not inds: sheet_error("Can't find sheet with name '%s'" % name)
        if len(inds)>1: sheet_error("Multiple sheets with name '%s'" % name)
        sheet_num = inds[0] + 1

    def letter2col_index(letter):
        """ A -> 0, B -> 1, Z -> 25, AA -> 26, BA -> 52 """
        base26digits = [1+ord(x)-ord("A") for x in letter]
        return sum([x*26**(len(base26digits) - k - 1)  for k,x in enumerate(base26digits)]) - 1

    def flatten(iter):
        return list(itertools.chain(*iter))

    def cell2text(cell):
        if cell is None:
            return ""
        elif 't' in cell.attrib and cell.attrib['t'] == 's':
            idx = int(cell.find(n("v")).text)
            si = ss_list[idx]
            t_elt = si.find(n("t"))
            if t_elt is not None:
              return t_elt.text
            t_elts = si.findall(n("r") + "/" + n("t"))
            if t_elts:
                text = "".join( (t.text) for t in t_elts )
                return text
            raise Exception("COULDNT DECODE CELL: %s" % ET.tostring(si))
        else:
            v_elt = cell.find(n("v"))
            if v_elt is None: return ""
            return v_elt.text

    ss_xml = z.read("xl/sharedStrings.xml")
    ss_list = ET.XML(ss_xml).findall(n("si"))

    xml = z.read("xl/worksheets/sheet%s.xml" % sheet_num)
    s = ET.fromstring(xml)
    rows = s.findall(n("sheetData")+"/"+n("row"))

    all_cells = flatten( [[c for c in row.findall(n("c"))] for row in rows] )
    max_col = max(letter2col_index(re.search("^[A-Z]+",c.attrib['r']).group()) for c in all_cells)

    def make_cells():
      return [None] * (max_col+1)

    warning_count=0
    warning_max = 20

    def warning(s):
        pass
        """
        global warning_count
        warning_count += 1
        if warning_count > warning_max: return
        print>>sys.stderr, "WARNING: %s" % s
        """
    def cell_text_clean(text):
        if text is None:
            return ''
        s = text.encode("utf8")
        if "\t" in s: warning("Clobbering embedded tab")
        if "\n" in s: warning("Clobbering embedded newline")
        if "\r" in s: warning("Clobbering embedded carriage return")
        s = s.replace("\t"," ").replace("\n"," ").replace("\r"," ")
        return s
    result = []
    for row in rows:
        #print type(row)
        cells_elts = row.findall(n("c"))
        inds = []  # parallel
        for c in cells_elts:
            letter = re.search("^[A-Z]+", c.attrib['r']).group()
            inds.append(letter2col_index(letter) )
        cells = make_cells()
        for c,j in zip(cells_elts,inds):             
           # print type(c), c
            cells[j] = c  
        tmp = myjoin((cell_text_clean(cell2text( c )) for c in cells), sep="\t")        
        result.append( tmp )
        #print result[len(result)-1].decode('utf8').encode('1251')
        #raw_input(">>>")
    #if warning_count > warning_max:
        #print>>sys.stderr, "%d total warnings, %d hidden" % (warning_count, warning_count-warning_max)
    
    return result, None
    
if __name__ == "__main__":
    print load('baza.xlsx')        