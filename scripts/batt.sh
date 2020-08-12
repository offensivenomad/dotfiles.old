#!/usr/bin/env python3
#
# Copyright (C) 2019 Alin Trăistaru
# Licensed under the GPL version 2 only
#
# A power supply indicator blocklet script for i3blocks

import sys
import re
from os import environ as ENV
import glob
import pprint
from datetime import timedelta
import argparse

pp = pprint.PrettyPrinter(width=80, indent=2, stream=sys.stderr).pprint

parser = argparse.ArgumentParser(description="A (very) configurable and (hilariously) over-engineered power (AC and battery) status blocklet.")

parser.add_argument("-d", "--debug", help="Print debug messages to STDERR", action="store_true")
parser.add_argument("-c", "--config", help="Print config to STDERR", action="store_true", dest="show_config")

group_summary = parser.add_mutually_exclusive_group()
group_summary.add_argument("-s", "--summary",    help="Show summarized stats if multiple batteries present [DEFAULT]", action="store_true",  default=True,  dest="bat_show_summary")
group_summary.add_argument("-S", "--no-summary", help="Show stats for each battery if multiple batteries present",   action="store_false", default=False, dest="bat_show_summary")

parser.add_argument("-p", "--crit-percent", help="Set battery critical level [DEFAULT=10]", metavar="PERCENT", type=float, default=10, dest="bat_crit_percent")

group_fullbat = parser.add_mutually_exclusive_group()
group_fullbat.add_argument("-f", "--last-full",   help="Use battery last full capacity [DEFAULT]", action="store_const", const="last",   dest="bat_full_type")
group_fullbat.add_argument("-F", "--design-full", help="Use battery design (factory) capacity",    action="store_const", const="design", dest="bat_full_type")

group_showtime = parser.add_mutually_exclusive_group()
group_showtime.add_argument("-t", "--show-time",    help="Show battery [dis]charging duration [DEFAULT]", action="store_true",  default=True,  dest="bat_show_time")
group_showtime.add_argument("-T", "--no-show-time", help="Don't show battery [dis]charging duration",     action="store_false", default=False, dest="bat_show_time")

group_showac = parser.add_mutually_exclusive_group()
group_showac.add_argument("-a", "--show-ac", help="Show AC state [DEFAULT]", action="store_true",  default=True,  dest="ac_show")
group_showac.add_argument("-A", "--no-show-ac", help="Don't show AC state",  action="store_false", default=False, dest="ac_show")

BLOCK_INSTANCE = ENV.get('BLOCK_INSTANCE', "").strip()
if len(BLOCK_INSTANCE):
    args = parser.parse_args(BLOCK_INSTANCE.split())
else:
    args = parser.parse_args()

DEFAULT_CONFIG = {
            'debug': False,
            'show_config': False,
            'bat_show_summary': True,
            'bat_crit_percent': float(10),
            'bat_full_type': "last",
            'bat_show_time': True,
            'ac_show': True
}

def str2obj(string):
    if re.match(r"^(y|yes|true)$", string, re.IGNORECASE):
        return True
    elif re.match(r"^(n|no|false)$", string, re.IGNORECASE):
        return False
    elif re.match(r"^(([0-9]+)|(([0-9]+)?\.([0-9]+)?))$", string):
        return float(string)
    elif len(string):
        return str(string)
    else:
        return None

def print_config():
    sep="   "
    longest_option = len(max(list(DEFAULT_CONFIG.keys())+['OPTION'],                        key=len))
    longest_value =  len(max([str(x['value'])  for x in list(CONFIG.values())] + ['VALUE'], key=len))
    longest_setby =  len(max([str(x['set-by']) for x in list(CONFIG.values())] + ['SET-BY'], key=len))

    print("{}   {}   {}".format(f"%-{longest_option}s" % "OPTION", f"%-{longest_value}s" % "VALUE", f"%-{longest_setby}s" % "SET-BY"), file=sys.stderr)
    print("=" * (longest_option + longest_value + longest_setby + 2*len(sep)), file=sys.stderr)

    for [k,v] in CONFIG.items():
        print("{}   {}   {}".format(f"%-{longest_option}s" % k, f"%-{longest_value}s" % v['value'], f"%-{longest_setby}s" % v['set-by']), file=sys.stderr)

def dbg(*contents):
    if not cfg['debug']:
        return
    
    for arg in contents:
        if type(arg) in [int, str]:
            print(arg, end='', flush=True, file=sys.stderr)
        else:
            pprint.PrettyPrinter(width=80, indent=2, stream=sys.stderr).pprint(arg)

def gentxt(ps):
    this = power[ps]
    txt = ""

    if re.match(r'^AC', ps):
        if this['style']['color']:
            txt = '<span color="{}" font="FontAwesome">{}</span> '.format(this['style']['color'], this['style']['icon'])
        else:
            txt = '<span font="FontAwesome">{}</span> '.format(this['style']['icon'])
    elif re.match(r'^BAT[0-9]', ps) or ps == "ALLBAT":
        if this['style']['color']:
            txt = '<span color="{}" font="FontAwesome">{}</span> {}%'.format(this['style']['color'], this['style']['icon'], "%d" % this['percent'])
        else:
            txt = '<span font="FontAwesome">{}</span> {}%'.format(this['style']['icon'], "%d" % this['percent'])

        if cfg['bat_show_time']:
            txt += " " + this.get('time', '')

    return txt.strip()

def strfdelta(tdelta, fmt):
    d = {}
    d["h"], rem = divmod(tdelta.seconds, 3600)
    d["hh"] = "%02d" % d["h"]
    d["m"], d["s"] = divmod(rem, 60)
    d["mm"] = "%02d" % d["m"]
    d["ss"] = "%02d" % d["s"]

    return fmt.format(**d)

### setup starts ###
CONFIG = DEFAULT_CONFIG.copy()

for k,v in list(CONFIG.items()):
    CONFIG[k] = {'value':v, 'set-by': "defaults"}

# Merge ARGV into CONFIG
for [k,v] in CONFIG.items():
    argvvalue = eval(f"args.{k}")

    if type(CONFIG[k]['value']) == type(argvvalue):
        if CONFIG[k]['value'] != argvvalue:
            CONFIG[k] = { 'value': argvvalue, "set-by": "OPTION"}

# Merge ENV into CONFIG
for [k,v] in CONFIG.items():
    if type(CONFIG[k]['value']) == type(str2obj(ENV.get(k, ""))):
        envvalue = str2obj(ENV.get(k, ""))
        if k == "bat_full_type" and not envvalue in ['last', 'design']:
            continue
        else:
            CONFIG[k] = { 'value': envvalue, "set-by": "ENV"}

cfg = dict()
for k,v in list(CONFIG.items()):
    cfg[k] = v['value']

### setup ends ###
### program starts ###

if cfg['show_config']:
    print_config()
    exit()

power = dict()

# Parse power supplies raw data
rawpspath = '/sys/class/power_supply/*/uevent'
rawps = glob.glob(rawpspath)

if not len(rawps):
    print(f"\nERROR: Could not read '{rawpspath}'. Is sysfs mounted?\n", file=sys.stderr)
    exit(2)

for uevent in rawps:
    name = uevent.split('/')[-2]
    power[name] = {'raw':{}, 'style':{}, 'fulltext': ''}
    with open(uevent) as f:
        lines = f.read().splitlines()
        for line in lines:
            [key,val] = line.split('=')
            power[name]['raw'][key.strip()] = val.strip().upper()

AC =  {
        '1': {'ICON': '\uf1e6 ', 'COLOR': False },
        '0': {'ICON': '\uf1e6 ', 'COLOR': 'red'}
      }

BAT = {
        'FULL'          : {'ICON': '\uf14a', 'COLOR': 'orange'},
        'CHARGING'      : {'ICON': '\uf0e7', 'COLOR': 'orange'},
        'DISCHARGING'   : {'ICON': '\uf241', 'COLOR': 'orange'},
        'UNKNOWN'       : {'ICON': '\uf241', 'COLOR': False}
      }

#  def color(percent): 
#      if percent < 10: 
#          # exit code 33 will turn background red 
#          return "#FFFFFF" 
#      if percent < 20: 
#          return "#FF3300" 
#      if percent < 30: 
#          return "#FF6600" 
#      if percent < 40: 
#          return "#FF9900" 
#      if percent < 50: 
#          return "#FFCC00" 
#      if percent < 60: 
#          return "#FFFF00" 
#      if percent < 70: 
#          return "#FFFF33" 
#      if percent < 80: 
#          return "#FFFF66" 
#      return "#FFFFFF" 

power['ALLBAT'] = {
            'raw': 
                {
                    'POWER_SUPPLY_STATUS': '',
                    'POWER_SUPPLY_ENERGY_NOW': 0,
                    'POWER_SUPPLY_ENERGY_FULL': 0,
                    'POWER_SUPPLY_ENERGY_FULL_DESIGN': 0,
                    'POWER_SUPPLY_POWER_NOW': 0
                },
            'style': {'icon': False, 'color': False}
            }

for ps in power.keys():
    if ps == "ALLBAT":
        continue

    this = power[ps]
    raw = this['raw']
    if re.match(r'^AC', ps):
        this['style']['icon']  =  AC[raw['POWER_SUPPLY_ONLINE']]['ICON']
        this['style']['color'] =  AC[raw['POWER_SUPPLY_ONLINE']]['COLOR']
        this['fulltext'] = gentxt(ps)
    elif re.match(r'BAT[0-9]', ps):
        this['style']['icon']  =  BAT[raw['POWER_SUPPLY_STATUS']]['ICON']
        this['style']['color'] =  BAT[raw['POWER_SUPPLY_STATUS']]['COLOR']

        if cfg['bat_full_type'] == "design":
            energy_full = int(raw['POWER_SUPPLY_ENERGY_FULL_DESIGN'])
        else:
            energy_full = int(raw['POWER_SUPPLY_ENERGY_FULL'])

        this['percent'] = int(raw['POWER_SUPPLY_ENERGY_NOW']) / energy_full * 100.0

        status = raw['POWER_SUPPLY_STATUS']
        if status in ['CHARGING', 'DISCHARGING']:
            if status == "CHARGING":
                reference = energy_full - int(raw['POWER_SUPPLY_ENERGY_NOW'])
            elif status == "DISCHARGING":
                reference = int(raw['POWER_SUPPLY_ENERGY_NOW'])

            if cfg['bat_show_time']:
                # show timer only when the OS updates the value of POWER_SUPPLY_POWER_NOW 
                if int(raw['POWER_SUPPLY_POWER_NOW']):
                    hours_remaining = reference / int(raw['POWER_SUPPLY_POWER_NOW'])
                    this['time'] = strfdelta(timedelta(hours=hours_remaining), "{h}:{mm}:{ss}")

        this['fulltext'] = gentxt(ps)

        allbatraw = power['ALLBAT']['raw']
        allbatraw['POWER_SUPPLY_ENERGY_FULL'] += int(raw['POWER_SUPPLY_ENERGY_FULL'])
        allbatraw['POWER_SUPPLY_ENERGY_FULL_DESIGN'] += int(raw['POWER_SUPPLY_ENERGY_FULL_DESIGN'])
        allbatraw['POWER_SUPPLY_ENERGY_NOW'] += int(raw['POWER_SUPPLY_ENERGY_NOW'])
        allbatraw['POWER_SUPPLY_POWER_NOW'] += int(raw['POWER_SUPPLY_POWER_NOW'])

        if allbatraw['POWER_SUPPLY_STATUS'] in ['', 'FULL', 'UNKNOWN']:
             allbatraw['POWER_SUPPLY_STATUS'] = raw['POWER_SUPPLY_STATUS']

allbat = power['ALLBAT']
allbatraw = allbat['raw']
allbatstyle = allbat['style']

if cfg['bat_full_type'] == 'design':
    energy_full = int(allbatraw['POWER_SUPPLY_ENERGY_FULL_DESIGN'])
elif cfg['bat_full_type'] == 'last':
    energy_full = int(allbatraw['POWER_SUPPLY_ENERGY_FULL'])
else:
    if cfg['debug']:
        dbg("ERROR: THIS IS A BUG: bat_full_type not in ['full', 'design']")
    exit(1)

allbat['percent'] = allbatraw['POWER_SUPPLY_ENERGY_NOW'] / energy_full * 100.0

status = allbatraw['POWER_SUPPLY_STATUS']
if status in ['CHARGING', 'DISCHARGING']:
    if status == "CHARGING":
        reference = energy_full - int(allbatraw['POWER_SUPPLY_ENERGY_NOW'])
    elif status == "DISCHARGING":
        reference = int(allbatraw['POWER_SUPPLY_ENERGY_NOW'])

    if cfg['bat_show_time']:
        # show timer only when the OS updates the value of POWER_SUPPLY_POWER_NOW 
        if int(allbatraw['POWER_SUPPLY_POWER_NOW']):
            hours_remaining = int(reference) / int(allbatraw['POWER_SUPPLY_POWER_NOW'])
            allbat['time'] = strfdelta(timedelta(hours=hours_remaining), "{h}:{mm}:{ss}")

allbatstyle['icon']  =  BAT[allbatraw['POWER_SUPPLY_STATUS']]['ICON']
allbatstyle['color'] =  BAT[allbatraw['POWER_SUPPLY_STATUS']]['COLOR']
allbat['fulltext'] = gentxt('ALLBAT')

psoutput = list(power.keys())

if not cfg['bat_show_summary']:
    psoutput.remove('ALLBAT')
else:
    psoutput = ['AC', 'ALLBAT']

if not cfg['ac_show']:
    psoutput.remove('AC')

dbg("=== POWER ===\n", power, "\n")

fulltext = (" ".join([gentxt(ps) for ps in sorted(psoutput)]))
shorttext = (" ".join([gentxt(ps) for ps in ['AC', 'ALLBAT']]))

print(fulltext)
print(shorttext)

if power['ALLBAT']['percent'] < cfg['bat_crit_percent']:
    exit(33)
