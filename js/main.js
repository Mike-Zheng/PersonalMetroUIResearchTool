//2016 mizTech NTU ESOE mikeZheng 
var app = angular.module("PersonalMetroApp", ['chart.js']);
chrome.storage.sync.get("defaultnewtab", function(storage) {
    if (storage.defaultnewtab) {
        chrome.tabs.update({ url: "chrome-search://local-ntp/local-ntp.html" })
    }
})

app.config(['$compileProvider', function($compileProvider) {

    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob):|data:image\/||chrome-extension\/)/);
}]);


app.controller("MetroController", function($scope, ChromeFactory) {
    // metro block 動態磚數量
    $scope.topRank = 20;
    $scope.metroGap = 4;
    // history 找尋數量
    $scope.historyMaxResults = 100000;

    //domainlist
    $scope.domainList = domainList;

    // 撈出來的history raw data資料
    // 每一筆[url, #visits, domainId]
    $scope.urlMappings = {};


    $scope.dataDump = [];
    $scope.miningObj = [];
    $scope.historyItems = [];
    $scope.backupHistoryItems = [];
    $scope.historyMetros = [];


    //box
    $scope.box = {};
    $scope.isBoxOpen = false;
    $scope.boxColor = 'rgb(6, 124, 190)';
    $scope.isColorError = false;
    $scope.colorLists = colorLists;

    //
    //tab
    $scope.tab = 'chart';
    $scope.rmse = "";

    $scope.rank = {
        d0: 8,
        d1: 5,
        d2: 5,
        d3: 2
    };




    $scope.chartLabels = [];
    $scope.chartSeries = [];

    $scope.chartData = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
        
    ];

    $scope.newChartName = "全部資料";
    $scope.count = 0;
    $scope.addToChart = function() {
        if (!$scope.newChartName || $scope.count >= 8) return;
        $scope.chartSeries.push($scope.newChartName);

        var metrArr = $scope.historyMetros.slice();

        metrArr.sort(function(a, b) {
            return b.times - a.times
        });
        if ($scope.count > 0) {
            $scope.chartLabels.forEach(function(d, j) {
                var match = false;
                metrArr.forEach(function(e, i) {
                    // console.log(e)
                    // console.log(d)
                    if (e.name == d) {
                        // console.log(d)
                        match = true;
                        // console.log((1 / (Math.pow(2, e.huffmanCoding.length))) * 100)
                        $scope.chartData[$scope.count].push((1 / (Math.pow(2, e.huffmanCoding.length))) * 100);

                    }
                    if (i == metrArr.length - 1) {
                        if (!match) {
                            $scope.chartData[$scope.count].push(0);

                        }
                    }

                });

            });

            metrArr.forEach(function(e, i) {
                var check = false;
                $scope.chartLabels.forEach(function(d, j) {
                    if (e.name == d) {
                        check = true;
                    }
                    if (j == $scope.chartLabels.length - 1) {
                        if (!check) {
                            $scope.chartLabels.push(e.name)
                            $scope.chartData[$scope.count].push((1 / (Math.pow(2, e.huffmanCoding.length))) * 100);

                        }
                    }
                });


            });



        } else {
            metrArr.forEach(function(e, i) {
                // console.log(e)
                // console.log(e)
                $scope.chartLabels.push(e.name)
                $scope.chartData[$scope.count].push((1 / (Math.pow(2, e.huffmanCoding.length))) * 100);

            });
        }



        $scope.count++;

    }


    $scope.refreshMetro = function() {
        // console.log($scope.historyItems);  
        $scope.urlMappings = {};
        $scope.miningObj = [];
        $scope.historyMetros = [];

        handleHistory(function() {
            $scope.historyMetros = creatHuffmanMetro($scope.miningObj);
            console.log($scope.historyMetros);
        });

        reColor();


    }


    $scope.adjust = function(k) {
        if (k == 0) {
            $scope.historyItems = $scope.backupHistoryItems.slice();

            console.log("讀取一共 " + $scope.historyItems.length + " 筆資料");
        } else if (k == 1) {
            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if (distantOfday >= 7) {
                    $scope.historyItems.splice(i, 1);
                }
            }

            console.log("讀取一共 " + $scope.historyItems.length + " 筆資料");

        } else if (k == 2) {
            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if (distantOfday < 7) {
                    $scope.historyItems.splice(i, 1);
                }
            }
            console.log("讀取一共 " + $scope.historyItems.length + " 筆資料");
        } else if (k == 3) {
            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if (distantOfday < 7 || distantOfday >= 14) {
                    $scope.historyItems.splice(i, 1);
                }
            }
            console.log("讀取一共 " + $scope.historyItems.length + " 筆資料");
        } else if (k == 4) {

            var targetDay = 6;
            var targetDay2 = 7;
            var day = new Date().getDay();
            if (day == 0) day = 7;
            console.log("今天星期" + day);


            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if ((Math.floor(distantOfday) + (targetDay - day + 7)) % 7 != 0 && (Math.floor(distantOfday) + (targetDay2 - day + 7)) % 7 != 0) {
                    $scope.historyItems.splice(i, 1);
                }
            }
            console.log("讀取假日一共 " + $scope.historyItems.length + " 筆資料");
        } else if (k == 5) {

            var untargetDay = 6;
            var untargetDay2 = 7;
            var day = new Date().getDay();
            if (day == 0) day = 7;
            console.log("今天星期" + day);


            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if ((Math.floor(distantOfday) + (untargetDay - day + 7)) % 7 == 0 || (Math.floor(distantOfday) + (untargetDay2 - day + 7)) % 7 == 0) {
                    $scope.historyItems.splice(i, 1);
                }
            }
            console.log("讀取平日一共 " + $scope.historyItems.length + " 筆資料");
        } else if (k > 10) {

            var targetDay = k - 10;
            var day = new Date().getDay();
            if (day == 0) day = 7;
            console.log("今天星期" + day);


            $scope.historyItems = $scope.backupHistoryItems.slice();
            for (var i = $scope.historyItems.length - 1; i >= 0; i--) {
                var distantOfday = (Date.now() - $scope.historyItems[i].lastVisitTime) / 86400000;
                if ((Math.floor(distantOfday) + (targetDay - day + 7)) % 7 != 0) {
                    $scope.historyItems.splice(i, 1);
                }
            }
            console.log("讀取星期" + targetDay + "一共 " + $scope.historyItems.length + " 筆資料");
        }



    }




    $scope.select1 = undefined;
    $scope.select2 = undefined;

    $scope.select = function(i) {
        console.log($scope.chartSeries[i]);
        if ($scope.select1 == i) {
            $scope.select1 = undefined;
        } else if ($scope.select2 == i) {
            $scope.select2 = undefined;
        } else if ($scope.select1 == undefined) {
            $scope.select1 = i;
        } else if ($scope.select2 == undefined) {
            $scope.select2 = i;
        } else if (!$scope.select1 && !$scope.select2) {
            return;

        }


        if ($scope.select1 != undefined && $scope.select2 != undefined)
            rmse($scope.select1, $scope.select2);






    }

    function rmse(s1, s2) {
        $scope.rmse = "";

        console.log($scope.chartLabels)
        console.log($scope.chartSeries)

        var a1 = $scope.chartData[s1].slice();
        var a2 = $scope.chartData[s2].slice();

        //補0
        if (a1.length > a2.length) {
            for (var i = a2.length; i < a1.length; i++) {
                a2.push(0);
            }

        } else if (a1.length < a2.length) {
            for (var i = a1.length; i < a2.length; i++) {
                a1.push(0);
            }
        }
        console.log(a1);
        console.log(a2);

        var a = 0;



        // a1.forEach(function(c1, i) {
        //     a2.forEach(function(c2, j) {

        //         a += Math.pow(c1 - c2,2);
        //         console.log(Math.pow(c1 - c2,2));

        //     });

        // });

        for (var i = 0; i < a1.length; i++) {
            a += Math.pow(a1[i]/100 - a2[i]/100, 2);
        }


        a = Math.sqrt(a / a1.length);

        console.log(a);



        $scope.rmse = a;
    }




    $scope.init = function() {
        $scope.urlMappings = {};
        $scope.miningObj = [];
        $scope.historyMetros = [];
        $scope.historyItems = [];
        // console.log("Copyright MizTech\n\nLicensed MikeZheng\nhttp://mike-zheng.github.io/\n           _   _____         _     \n          (_) |_   _|       | |    \n _ __ ___  _ ___| | ___  ___| |__  \n| '_ ` _ \\| |_  / |/ _ \\/ __| '_ \\ \n| | | | | | |/ /| |  __/ (__| | | |\n|_| |_| |_|_/___\\_/\\___|\\___|_| |_|\n               mike-zheng.github.io");
        // console.log("copy(JSON.stringify(temp1))");
        getHistory(function() {
            $scope.historyMetros = creatHuffmanMetro($scope.miningObj);
            // console.log($scope.historyMetros);
            console.log($scope.historyMetros);




        });

        reColor();

    }


    function handleHistory(callback) {
        // $scope.historyItems.length=8;

        historyItemPreProcessing($scope.historyItems, function() {
            callback();
        })


    }

    function getHistory(callback) {
        ChromeFactory.historySearch($scope.historyMaxResults).then(function(historyItems) {
            historyItems.sort(function(a, b) {
                return a.lastVisitTime - b.lastVisitTime
            });
            $scope.backupHistoryItems = historyItems;
            $scope.historyItems = historyItems;

            historyItemPreProcessing($scope.historyItems, function() {
                callback();
            })

        });

    }


    function historyItemPreProcessing(historyItems, callback) {
        var domainId = 0;

        for (var i = 0; i < historyItems.length; i++) {
            var newDomainId;

            var item = historyItems[i];

            //倒出資料
            var item_dump = JSON.stringify(historyItems[i]);
            $scope.dataDump.push(item_dump);

            var domain = parseDomain(item.url);


            if (!(domain in $scope.urlMappings)) {
                if (domain == undefined) {
                    continue;
                }
                newDomainId = domainId;
                var lastVisit = historyItems[i].lastVisitTime;
                $scope.urlMappings[domain] = [item.url, 1, domainId++, lastVisit, 0, 0, 0, 0]; // [raw favicon url, #visits, domainId,lastvisit]

            } else {
                $scope.urlMappings[domain][1] += 1;
                newDomainId = $scope.urlMappings[domain][2];
                var lastVisit = historyItems[i].lastVisitTime;
                if ($scope.urlMappings[domain] && $scope.urlMappings[domain][3] > lastVisit) {
                    lastVisit = $scope.urlMappings[domain][3];
                }
                $scope.urlMappings[domain][3] = lastVisit;
                var distantOfday = (Date.now() - historyItems[i].lastVisitTime) / 86400000;
                if (distantOfday <= 1) {
                    $scope.urlMappings[domain][4] += 1;
                } else if (distantOfday > 1 && distantOfday <= 2) {
                    $scope.urlMappings[domain][5] += 1;
                } else if (distantOfday > 2 && distantOfday <= 3) {
                    $scope.urlMappings[domain][6] += 1;
                } else if (distantOfday > 3 && distantOfday <= 4) {
                    $scope.urlMappings[domain][7] += 1;
                }

            }




        }


        /*倒出資料 開始*/
        // console.log("dataDump")
        //  console.log($scope.dataDump);
        // localStorage.setItem("Personbal", $scope.dataDump.join());
        // console.dir($scope.dataDump.join());
        /*倒出資料 結束*/

        // get most visited sites
        var sortedUrls = [];

        for (var url in $scope.urlMappings) {
            sortedUrls.push([$scope.urlMappings[url][1], url]);
        }
        sortedUrls.sort(function(a, b) {
            return (b[0] - a[0]);
        });
        // console.log(sortedUrls);


        for (var i = 0; i < $scope.topRank; i++) {
            if (sortedUrls[i] && sortedUrls[i][0] && sortedUrls[i][1]) {

                var newObj = {};
                newObj.domain = sortedUrls[i][1];
                newObj.times = sortedUrls[i][0];
                // newObj.favicon = 'chrome://favicon/' + $scope.urlMappings[sortedUrls[i][1]][0];
                // newObj.favicon = 'chrome://favicon/' + $scope.urlMappings[newObj.domain][0];
                newObj.favicon = 'chrome://favicon/' + $scope.urlMappings[newObj.domain][0];
                newObj.lastVisitTime = ($scope.urlMappings[sortedUrls[i][1]])[3];
                newObj.fromPresentTime = (newObj.lastVisitTime - Date.now()) / 1000;
                newObj.day0Visit = $scope.urlMappings[sortedUrls[i][1]][4];
                newObj.day1Visit = $scope.urlMappings[sortedUrls[i][1]][5];
                newObj.day2Visit = $scope.urlMappings[sortedUrls[i][1]][6];
                newObj.day3Visit = $scope.urlMappings[sortedUrls[i][1]][7];
                var checkDouble = $.grep($scope.miningObj, function(e) {
                    return makeName(e) == makeName(newObj);
                });
                if (checkDouble[0]) {
                    checkDouble[0].times += newObj.times;
                    if (newObj.lastVisitTime < checkDouble[0].lastVisitTime) {
                        checkDouble[0].lastVisitTime = newObj.lastVisitTime;
                    }
                    if (newObj.fromPresentTime > checkDouble[0].fromPresentTime) {
                        checkDouble[0].fromPresentTime = newObj.fromPresentTime;
                    }
                    checkDouble[0].day0Visit += newObj.day0Visit;
                    checkDouble[0].day1Visit += newObj.day1Visit;
                    checkDouble[0].day2Visit += newObj.day2Visit;
                    checkDouble[0].day3Visit += newObj.day3Visit;
                    checkDouble[0].ddddd = 123;
                    $scope.miningObj.forEach(function(m, i) {
                        if (m.domain == newObj.domain) {
                            m = checkDouble[0];
                        }

                    });
                } else {
                    $scope.miningObj.push(newObj);
                }


            }

        }

        callback();
    }

    //製作metro
    function creatHuffmanMetro(MetroObj) {

        var metros = [];
        var loopFlag = true;
        var collections = {};

        while (loopFlag) {
            metros = [];
            collections = {};


            MetroObj.forEach(function(m, i) {


                if (m.domain)
                    collections[m.domain] = preProcessing(m);
                else {
                    // console.log(m);
                    collections[m.url] = preProcessing(m);
                }
            });
            // console.log(collections);
            // collections={
            //     "a":30,
            //     "b":28,
            //     "c":5,
            //     "d":2,
            //     "e":17,
            //     "f":8,
            //     "g":10
            // }
            // console.log(collections);
            var huff = new HuffmanEncoding(collections);
            var collectionsEncode = huff.get_encoding();
            // console.log(collectionsEncode);

            var sortedObj = sortObj(collectionsEncode, 1);
            // console.log(sortedObj);
            var count = 0;
            var countDown = countProperties(sortedObj);
            var lengthMax = 0;
            var lengthMin = 9999;

            $.each(sortedObj, function(key, value) {
                if (value.length > lengthMax) lengthMax = value.length;
                if (value.length < lengthMin) lengthMin = value.length;

                var metroS = MetroObj.filter(function(obj) {
                    return key == obj.domain;
                });

                var metro = metroS[0];
                if (metro) {
                    metro.index = count;
                    metro.huffmanCoding = value;
                    metro.name = makeName(metro);
                    if (containsObject(metro, domainList)) {
                        var t = containsObject(metro, domainList);
                        metro = $.extend(metro, t);
                        // console.log(metro);
                    }
                    metro.cssStyle = creatStyle(value.length);
                    count++;

                    metros.push(metro);
                }
                if (!--countDown) {
                    // console.log(countDown)
                    // console.log(lengthMax)
                    // console.log(lengthMin)
                    if (lengthMax - lengthMin < $scope.metroGap) {
                        loopFlag = false;
                        // return metros;
                    }
                    MetroObj.splice(-1, 1);
                    // console.log(MetroObj);
                }
            });

            if (!loopFlag)
                return metros;


        }
        if (!loopFlag)
            return metros;

    }

    //=============================
    //=============================
    //=============================
    //=============================
    //=============================
    //=============================
    //=============================
    //=============================

    // not imopratnt

    function reColor() {
        setTimeout(function() {
            if ($scope.isColorError) {
                // console.log("error");
                $scope.$apply(function() {
                    $scope.historyMetros.forEach(function(m, i) {
                        if (!m.src)
                            $scope.color($scope.historyMetros, i);
                    });

                });

                // location.reload();
            }

        }, 1000);

    }
    $scope.color = function(metros, i) {
        if (!metros) console.log(metros)
        if (metros && !metros[i].src && (!metros[i].color || $scope.isColorError)) {
            var rgb = getAverageRGB(document.getElementById('img' + i));
            if (rgb) {
                if (rgb['r'] == 18 && rgb['g'] == 18 && rgb['b'] == 18) {
                    var tempRgb = getRandColor(metros[i].name, $scope.colorLists);

                    metros[i].color = tempRgb;
                    metros[i].colorText = "rgb(" + tempRgb['r'] + "," + tempRgb['g'] + "," + tempRgb['b'] + ")";
                } else {

                    metros[i].color = rgb;
                    metros[i].colorText = "rgb(" + rgb['r'] + "," + rgb['g'] + "," + rgb['b'] + ")";
                }

                // console.log(metros[i]);
            }

        }

        return true;



    }


    //將網址解析出domain name
    function parseDomain(_url) {
        if (!_url) console.log(_url);
        var matches = _url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        return matches && matches[1];
    }


    $scope.stripHttp = function(url) {
        if (url.split('')[0] == 'h' && url.split('')[1] == 't' && url.split('')[2] == 't') {
            url = url.split('://')[1];
            // console.log(url);
            return url;
        }

        return url;

    }


    //tab
    $scope.switchTab = function(tab) {
        $scope.tab = tab;

    }





    $scope.goto = function(metro) {
        // console.log(metro);
        metro.domain = $scope.stripHttp(metro.domain);
        // console.log('http://' + metro.domain);
        $scope.isBoxOpen = true;
        $scope.boxColor = metro.colorText;
        $scope.box = metro;
        setTimeout(function() {
            if ($scope.isBoxOpen)
                window.location = 'http://' + metro.domain
        }, 1500);
    }

    function getAverageRGB(imgEl) {
        if (!imgEl) return null;
        // console.log(imgEl)
        var blockSize = 1, // only visit every 5 pixels
            defaultRGB = { r: 128, g: 128, b: 128 }, // for non-supporting envs
            canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d'),
            data, width, height,
            i = -4,
            length,
            rgb = { r: 0, g: 0, b: 0 },
            count = 0;

        if (!context) {
            return defaultRGB;
        }
        height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
        width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

        context.drawImage(imgEl, 0, 0);

        try {
            data = context.getImageData(0, 0, width, height);
            // console.log(data);
        } catch (e) {
            /* security error, img on diff domain */
            // alert('x');
            // console.log('error');
            $scope.isColorError = true;
            return defaultRGB;
        }

        length = data.data.length;

        while ((i += blockSize * 4) < length) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i + 1];
            rgb.b += data.data[i + 2];
        }

        // ~~ used to floor values
        rgb.r = ~~(rgb.r / count);
        rgb.g = ~~(rgb.g / count);
        rgb.b = ~~(rgb.b / count);

        return rgb;

    }


    function containsObject(obj, list) {
        // console.log(list);
        // console.log(obj);

        if (obj.domain.split("")[0] != 'w' && obj.domain.split(".")[1] == 'google')
            return false;
        for (var x in list) {
            if (list[x].domain == obj.domain || list[x].name == obj.name || list[x].domainName == obj.name) {
                return list[x];
            }
        }
        return false;
    }

    function makeName(metro) {
        var urlArry = metro.domain.split(".");
        if (urlArry[0] == 'www') return urlArry[1];
        else if (urlArry[1] == 'com' ||
            urlArry[1] == 'net' ||
            urlArry[1] == 'org' ||
            urlArry[1] == 'edu' ||
            urlArry[1] == 'gov' ||
            urlArry[1] == 'info' ||
            urlArry[1] == 'io' ||
            urlArry[1] == 'mail' ||
            urlArry[1] == 'cc' ||
            urlArry[1] == 'me'
        ) return urlArry[0];
        else if (urlArry[2] == 'com' ||
            urlArry[2] == 'net' ||
            urlArry[2] == 'org' ||
            urlArry[2] == 'edu' ||
            urlArry[2] == 'gov' ||
            urlArry[2] == 'info' ||
            urlArry[2] == 'io' ||
            urlArry[2] == 'mail' ||
            urlArry[2] == 'cc' ||
            urlArry[2] == 'me'
        ) return urlArry[1];
        else if (urlArry[3] == 'com' ||
            urlArry[3] == 'net' ||
            urlArry[3] == 'org' ||
            urlArry[3] == 'edu' ||
            urlArry[3] == 'gov' ||
            urlArry[3] == 'info' ||
            urlArry[3] == 'io' ||
            urlArry[3] == 'mail' ||
            urlArry[3] == 'cc' ||
            urlArry[2] == 'me'
        ) return urlArry[2];
        else {
            if (metro.domain.split(":")[0] == "127.0.0.1")
                return "127.0.0.1";
            else if (metro.domain.split(":")[0] == "localhost")
                return "localhost";
            else
                return urlArry[1];
        }
    }


    function creatStyle(len) {
        switch (len) {
            case 1:
                return 'metro-2x1';
                break;
            case 2:
                return 'metro-2x2';
                break;
            case 3:
                return 'metro-4x2';
                break;
            case 4:
                return 'metro-4x4';
                break;
            case 5:
                return 'metro-8x4';
                break;
            case 6:
                return 'metro-8x8';
                break;
            case 7:
                return 'metro-16x8';
                break;
            case 8:
                return 'metro-16x16';
                break;
            case 9:
                return 'metro-32x16';
                break;
            case 10:
                return 'metro-32x32';
                break;
            default:
                console.log("overflow!");


        }

    }





    function preProcessing(data) {
        //data
        // day0Visit
        // day1Visit
        // day2Visit
        // day3Visit
        // domain:"www.google.com.tw"
        // favicon:"chrome://favicon/https://www.google.com.tw/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=nvm%20%E5%AE%89%E8%A3%9D"
        // fromPresentTime:-75.59214208984375
        // lastVisitTime:1490083652738.858
        // times:2918    
        var day = 86400;
        var rank;
        rank = data.day0Visit * $scope.rank.d0 + data.day1Visit * $scope.rank.d1 + data.day2Visit * $scope.rank.d2 + data.day3Visit * $scope.rank.d3;

        // console.log(data.domain + " " + rank);
        // 回傳權重


        return Math.sqrt(data.times) + (0.1 * rank);
        // return data.times*rank;
        // + Math.log(sortedUrls[i][0]);
    }



});



app.factory('ChromeFactory', function($q, $http) {

    var _factory = {};
    _factory.historySearch = function(historyMaxResults) {
        var defer = $q.defer();
        chrome.history.search({
            'text': '',
            'maxResults': historyMaxResults,
            'startTime': -1,
        }, function(historyItems) {
            if (historyItems) {
                _factory.data = historyItems;
                defer.resolve(_factory.data);
            } else {
                alert('error');
                defer.reject(_factory.data);
            }
        });
        return defer.promise;

    };

    _factory.bookmarkSearch = function(historyMaxResults) {
        var defer = $q.defer();
        chrome.bookmarks.search({}, function(bookmarkItems) {
            if (bookmarkItems) {
                _factory.data = bookmarkItems;
                defer.resolve(_factory.data);
            } else {
                alert('error');
                defer.reject(_factory.data);
            }
        });
        return defer.promise;

    };

    return _factory;
});






function countProperties(obj) {
    var count = 0;

    for (var property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            count++;
        }
    }

    return count;
}

// Extend object to support sort method
function sortObj(obj, depth) {
    "use strict";
    // Default sort by key
    if (!depth || typeof parseInt(depth) !== 'number') depth = 0;

    function Obj2Array(obj) {
        var newObj = [];
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) return;
            var value = [key, obj[key]];
            newObj.push(value);
        }
        return newObj;
    }

    var sortedArray = Obj2Array(obj).sort(function(a, b) {
        if (a[depth].length < b[depth].length) return -1;
        if (a[depth].length > b[depth].length) return 1;
        return 0;
    });

    function recreateSortedObject(targ) {
        var sortedObj = {};
        for (var i = 0; i < targ.length; i++) {
            sortedObj[targ[i][0]] = targ[i][1];
        }
        return sortedObj;
    }
    return recreateSortedObject(sortedArray);

}


function getRandColor(name, list) {
    var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    var sum = 0;
    if (name)
        name.split("").forEach(function(c, i) {
            sum += alphabet.indexOf(c) + 1
        });
    else {
        'underfined'.split("").forEach(function(c, i) {
            sum += alphabet.indexOf(c) + 1
        });
    }

    return list[Math.floor((sum % list.length))].rgb;
}
