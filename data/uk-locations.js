const slugify = (value) => String(value)
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const services = [
  ["ai-automation", "AI & Automation", "AI automation consultancy"],
  ["digital-strategy", "Digital Strategy", "digital strategy consultancy"],
  ["ecommerce-growth", "eCommerce Growth", "ecommerce growth consultancy"],
  ["operational-excellence", "Operational Excellence", "operational excellence consultancy"],
  ["fractional-leadership", "Fractional Leadership", "fractional digital leadership"],
  ["project-delivery", "Project Delivery", "digital project delivery consultancy"]
].map(([slug, title, searchLabel]) => ({ slug, title, searchLabel }));

// name|nation|region|county|latitude|longitude
// Coordinates are city-centre reference points used for map embeds and geographic context.
const rows = `
Derby|England|East Midlands|Derbyshire|52.9225|-1.4746
Chesterfield|England|East Midlands|Derbyshire|53.2350|-1.4210
Buxton|England|East Midlands|Derbyshire|53.2591|-1.9103
Leicester|England|East Midlands|Leicestershire|52.6369|-1.1398
Loughborough|England|East Midlands|Leicestershire|52.7721|-1.2062
Lincoln|England|East Midlands|Lincolnshire|53.2307|-0.5406
Grantham|England|East Midlands|Lincolnshire|52.9125|-0.6436
Boston|England|East Midlands|Lincolnshire|52.9789|-0.0266
Northampton|England|East Midlands|Northamptonshire|52.2405|-0.9027
Nottingham|England|East Midlands|Nottinghamshire|52.9548|-1.1581
Mansfield|England|East Midlands|Nottinghamshire|53.1472|-1.1987
Bedford|England|East of England|Bedfordshire|52.1364|-0.4607
Luton|England|East of England|Bedfordshire|51.8787|-0.4200
Cambridge|England|East of England|Cambridgeshire|52.2053|0.1218
Peterborough|England|East of England|Cambridgeshire|52.5695|-0.2405
Chelmsford|England|East of England|Essex|51.7356|0.4685
Colchester|England|East of England|Essex|51.8892|0.9042
Southend-on-Sea|England|East of England|Essex|51.5459|0.7077
St Albans|England|East of England|Hertfordshire|51.7520|-0.3360
Watford|England|East of England|Hertfordshire|51.6565|-0.3903
Norwich|England|East of England|Norfolk|52.6309|1.2974
King's Lynn|England|East of England|Norfolk|52.7517|0.3952
Ipswich|England|East of England|Suffolk|52.0567|1.1482
Bury St Edmunds|England|East of England|Suffolk|52.2469|0.7113
London|England|London|Greater London|51.5074|-0.1278
Westminster|England|London|Greater London|51.4975|-0.1357
Camden|England|London|Greater London|51.5390|-0.1426
Islington|England|London|Greater London|51.5380|-0.1027
Croydon|England|London|Greater London|51.3762|-0.0982
Barnet|England|London|Greater London|51.6252|-0.1517
Newcastle upon Tyne|England|North East|Tyne and Wear|54.9783|-1.6178
Sunderland|England|North East|Tyne and Wear|54.9069|-1.3838
Durham|England|North East|County Durham|54.7753|-1.5849
Middlesbrough|England|North East|Teesside|54.5742|-1.2350
Darlington|England|North East|County Durham|54.5236|-1.5595
Manchester|England|North West|Greater Manchester|53.4808|-2.2426
Salford|England|North West|Greater Manchester|53.4875|-2.2901
Stockport|England|North West|Greater Manchester|53.4106|-2.1575
Bolton|England|North West|Greater Manchester|53.5769|-2.4282
Liverpool|England|North West|Merseyside|53.4084|-2.9916
Chester|England|North West|Cheshire|53.1934|-2.8931
Warrington|England|North West|Cheshire|53.3900|-2.5960
Preston|England|North West|Lancashire|53.7632|-2.7031
Lancaster|England|North West|Lancashire|54.0470|-2.8010
Blackpool|England|North West|Lancashire|53.8175|-3.0357
Carlisle|England|North West|Cumbria|54.8925|-2.9329
Brighton and Hove|England|South East|East Sussex|50.8225|-0.1372
Hove|England|South East|East Sussex|50.8279|-0.1687
Lewes|England|South East|East Sussex|50.8739|0.0088
Eastbourne|England|South East|East Sussex|50.7680|0.2905
Hastings|England|South East|East Sussex|50.8543|0.5735
Worthing|England|South East|West Sussex|50.8179|-0.3729
Crawley|England|South East|West Sussex|51.1091|-0.1872
Horsham|England|South East|West Sussex|51.0629|-0.3259
Guildford|England|South East|Surrey|51.2362|-0.5704
Woking|England|South East|Surrey|51.3168|-0.5600
Reading|England|South East|Berkshire|51.4543|-0.9781
Slough|England|South East|Berkshire|51.5105|-0.5950
Oxford|England|South East|Oxfordshire|51.7520|-1.2577
Milton Keynes|England|South East|Buckinghamshire|52.0406|-0.7594
Southampton|England|South East|Hampshire|50.9097|-1.4044
Portsmouth|England|South East|Hampshire|50.8198|-1.0880
Winchester|England|South East|Hampshire|51.0598|-1.3101
Maidstone|England|South East|Kent|51.2704|0.5227
Canterbury|England|South East|Kent|51.2802|1.0789
Dover|England|South East|Kent|51.1279|1.3134
Bristol|England|South West|Bristol|51.4545|-2.5879
Bath|England|South West|Somerset|51.3811|-2.3590
Gloucester|England|South West|Gloucestershire|51.8642|-2.2382
Cheltenham|England|South West|Gloucestershire|51.8994|-2.0783
Exeter|England|South West|Devon|50.7184|-3.5339
Plymouth|England|South West|Devon|50.3755|-4.1427
Bournemouth|England|South West|Dorset|50.7192|-1.8808
Poole|England|South West|Dorset|50.7151|-1.9872
Swindon|England|South West|Wiltshire|51.5558|-1.7797
Salisbury|England|South West|Wiltshire|51.0688|-1.7945
Truro|England|South West|Cornwall|50.2632|-5.0510
Birmingham|England|West Midlands|West Midlands|52.4862|-1.8904
Coventry|England|West Midlands|West Midlands|52.4068|-1.5197
Wolverhampton|England|West Midlands|West Midlands|52.5870|-2.1288
Solihull|England|West Midlands|West Midlands|52.4118|-1.7776
Worcester|England|West Midlands|Worcestershire|52.1936|-2.2216
Hereford|England|West Midlands|Herefordshire|52.0565|-2.7160
Stoke-on-Trent|England|West Midlands|Staffordshire|53.0027|-2.1794
Shrewsbury|England|West Midlands|Shropshire|52.7073|-2.7553
Telford|England|West Midlands|Telford and Wrekin|52.6778|-2.4674
Leeds|England|Yorkshire and Humber|West Yorkshire|53.8008|-1.5491
Bradford|England|Yorkshire and Humber|West Yorkshire|53.7950|-1.7594
Wakefield|England|Yorkshire and Humber|West Yorkshire|53.6833|-1.4977
Sheffield|England|Yorkshire and Humber|South Yorkshire|53.3811|-1.4701
Doncaster|England|Yorkshire and Humber|South Yorkshire|53.5228|-1.1285
York|England|Yorkshire and Humber|North Yorkshire|53.9590|-1.0815
Harrogate|England|Yorkshire and Humber|North Yorkshire|53.9921|-1.5418
Hull|England|Yorkshire and Humber|East Riding of Yorkshire|53.7676|-0.3274
Edinburgh|Scotland|Central Scotland|City of Edinburgh|55.9533|-3.1883
Glasgow|Scotland|West Scotland|Glasgow City|55.8642|-4.2518
Stirling|Scotland|Central Scotland|Stirling|56.1165|-3.9369
Aberdeen|Scotland|North East Scotland|Aberdeen City|57.1497|-2.0943
Dundee|Scotland|North East Scotland|Dundee City|56.4620|-2.9707
Inverness|Scotland|Highlands|Highland|57.4778|-4.2247
Perth|Scotland|Central Scotland|Perth and Kinross|56.3950|-3.4308
Paisley|Scotland|West Scotland|Renfrewshire|55.8473|-4.4401
Ayr|Scotland|West Scotland|South Ayrshire|55.4586|-4.6292
Dumfries|Scotland|South Scotland|Dumfries and Galloway|55.0709|-3.6051
Cardiff|Wales|South East Wales|Cardiff|51.4816|-3.1791
Newport|Wales|South East Wales|Newport|51.5842|-2.9977
Swansea|Wales|South West Wales|Swansea|51.6214|-3.9436
Wrexham|Wales|North Wales|Wrexham|53.0430|-2.9916
Bangor|Wales|North Wales|Gwynedd|53.2274|-4.1293
Aberystwyth|Wales|Mid Wales|Ceredigion|52.4153|-4.0829
Llandudno|Wales|North Wales|Conwy|53.3241|-3.8276
Bridgend|Wales|South East Wales|Bridgend|51.5043|-3.5769
Carmarthen|Wales|West Wales|Carmarthenshire|51.8560|-4.3120
Belfast|Northern Ireland|Belfast Region|County Antrim|54.5973|-5.9301
Derry|Northern Ireland|County Londonderry|County Londonderry|54.9966|-7.3086
Lisburn|Northern Ireland|Belfast Region|County Antrim|54.5162|-6.0580
Newry|Northern Ireland|County Down|County Down|54.1751|-6.3402
Armagh|Northern Ireland|County Armagh|County Armagh|54.3503|-6.6528
Bangor NI|Northern Ireland|County Down|County Down|54.6534|-5.6680
Ballymena|Northern Ireland|County Antrim|County Antrim|54.8654|-6.2804
Coleraine|Northern Ireland|County Londonderry|County Londonderry|55.1333|-6.6667
Enniskillen|Northern Ireland|County Fermanagh|County Fermanagh|54.3438|-7.6315
Omagh|Northern Ireland|County Tyrone|County Tyrone|54.6000|-7.3000
`.trim().split("\n");

const locations = rows.map((row) => {
  const [name, nation, region, county, latitude, longitude] = row.split("|");
  return {
    name,
    slug: slugify(name),
    nation,
    nationSlug: slugify(nation),
    region,
    regionSlug: slugify(region),
    county,
    countySlug: slugify(county),
    latitude: Number(latitude),
    longitude: Number(longitude)
  };
});

module.exports = { locations, services, slugify };
