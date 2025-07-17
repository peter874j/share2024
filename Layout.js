var info = new Vue({
    el: "#info",
    data: {
        isDisplay: true
    }
})

var app = new Vue({
    el: "#app",
    data: {
        apiKey: 'GyZrkWYw.HNqX3Zb4C3nS61Sj8JcxWomnWjWZnkvi',
        counter: 0,
        sys_timestamp: '',
        heatMapObs: null,
        heatMapData: {},
        main_all_status: '',
        sub_all_status: '',
        heatMapInstance: {},
        drawingData: [],
        visitorData: {},
        MainAreaData: [],
        HotAreaData: [{
            num: "序廳",
            img: "",
            time: ""
        }]
    },
    created: function () {
        this.init();
    },
    watch: {
        heatMapData: {
            handler: function (newValue, oldValue) {
                this.heatMapInit();
            },
            deep: true,
            immediate: false
        }
    },
    mounted() {
        let self = this;
        self.HeatmapTimer = setInterval(self.LoadHeatmapData, 1000);
        self.VisitorTimer = setInterval(self.LoadVisitorData, 30000);
        self.HotAreaTimer = setInterval(self.LoadHotAreaData, 30000);
        self.SwitchCardTimer = setInterval(self.SwitchCard, 30000);
    },
    computed: {
        peopleCountClass() {
            value = parseInt(this.heatMapData.main_area_count);
            if (value >= 31) {
                return 'gradient-2'
            } else if (value >= 21 && value <= 30) {
                return 'gradient-3'
            } else if (value >= 11 && value <= 20) {
                return 'gradient-1'
            } else {
                return 'gradient-4'
            }
        }
    },
    methods: {
        init: async function () {
            let self = this;
            await self.GetArea();
            await self.LoadHotAreaData();
            await self.LoadHeatmapData();
            await self.LoadVisitorData();
            await self.heatMapInit();
            self.sys_timestamp = Math.floor(Date.now() / 1000);
            self.heatMapObs = new ResizeObserver(self.heatMapInit);
            self.heatMapObs.observe(document.getElementById('layout'));
        },
        async LoadVisitorData() {
            let self = this;
            // console.log("LoadVisitorData")            
            await axios.get('../API/GetAreaVisitor', {
                    headers: {
                        'Authorization': `Api-Key ${self.apiKey}`
                    }
                })
                .then((res) => {
                    // console.log(res)
                    self.visitorData = res.data[0];
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        async LoadHeatmapData() {
            let self = this;
            await axios.get('../API/GetHeatmap', {
                    headers: {
                        'Authorization': `Api-Key ${self.apiKey}`
                    }
                })
                .then((res) => {
                    self.heatMapData = res.data[0];
                    // console.log('heatMapData:', self.heatMapData);

                    if (self.heatMapData.main_area_count >= 31) {
                        self.main_all_status = '壅擠'
                    } else if (self.heatMapData.main_area_count >= 21 && self.heatMapData.main_area_count <= 30) {
                        self.main_all_status = '略多'
                    } else if (self.heatMapData.main_area_count >= 11 && self.heatMapData.main_area_count <= 20) {
                        self.main_all_status = '普通'
                    } else {
                        self.main_all_status = '舒適'
                    }

                    if (self.heatMapData.sub_area_count1 >= 31) {
                        self.sub_all_status = '壅擠'
                    } else if (self.heatMapData.sub_area_count1 >= 21 && self.heatMapData.sub_area_count1 <= 30) {
                        self.sub_all_status = '略多'
                    } else if (self.heatMapData.sub_area_count1 >= 11 && self.heatMapData.sub_area_count1 <= 20) {
                        self.sub_all_status = '普通'
                    } else {
                        self.sub_all_status = '舒適'
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        createPointData(data) {
            this.drawData = []
            var scaleRatio = {};
            scaleRatio = {
                width: document.getElementById('map').width / 859,
                height: document.getElementById('map').height / 922,
            }
            data.forEach(element => {
                obj = {
                    "x": element[0] * scaleRatio.width,
                    "y": element[1] * scaleRatio.height,
                    "value": element[2]
                }
                this.drawData.push(obj);
            });
        },
        async heatMapInit() {
            let self = this;
            if (document.getElementsByClassName('heatmap-canvas')[0] != undefined) {
                document.getElementsByClassName('heatmap-canvas')[0].remove();
                self.heatMapInstance = {}
                var radiusScale = document.getElementById('map').width * (60 / 1120)
            }
            self.heatMapInstance = h337.create({
                container: document.getElementById('layout'),
                maxOpacity: 0.4,
                backgroundColor: 'rgba(63, 127, 191,.2)',
                radius: radiusScale - 15,
                scaleRadius: true,
                gradient: {
                    '.0': 'rgba(63, 127, 191,.2)',
                    '.25': 'green',
                    '.5': 'yellow',
                    '.75': 'red'
                }
            });
            self.createPointData(JSON.parse(self.heatMapData.data));

            const drawData = {
                max: 100,
                data: self.drawData
            };
            self.heatMapInstance.setData(drawData);
            var gradientCfg = {};

            function updateLegend(data) {
                document.querySelector('#min').innerHTML = "舒適";
                document.querySelector('#max').innerHTML = "擁擠";
                if (data.gradient != gradientCfg) {
                    gradientCfg = data.gradient;
                    var gradient = document.getElementsByClassName('heatmap-canvas')[0].getContext('2d').createLinearGradient(0, 0, 100, 1);
                    for (var key in gradientCfg) {
                        gradient.addColorStop(key, gradientCfg[key]);
                    }
                    document.getElementsByClassName('heatmap-canvas')[0].getContext('2d').fillStyle = gradient;
                    document.getElementsByClassName('heatmap-canvas')[0].getContext('2d').fillRect(0, 0, 100, 10);
                    document.querySelector('#gradient').src = document.getElementsByClassName('heatmap-canvas')[0].toDataURL();
                }
            };
            var heatMapWrapper = document.querySelector('.heatmap-canvas');
            var tooltip = document.querySelector('.heat-map-tooltip');
        },
        async GetArea() {
            let self = this;
            await axios.get('../API/GetAllArea', {
                    headers: {
                        'Authorization': `Api-Key ${self.apiKey}`
                    }
                })
                .then(function (response) {                    
                    let fCategory = [];
                    response.data.forEach(item => {
                        if (item.area_num.startsWith("F")) {
                            fCategory.push(item);
                        }
                    });
                    self.MainAreaData = fCategory;
                })
                .catch((error) => {
                    console.log('GetArea error - ', error);
                });
        },
        async LoadHotAreaData() {
            let self = this;
            try{
                const response = await axios.get('../API/GetHotAreaVisitor', {
                    headers: {
                        'Authorization': `Api-Key ${self.apiKey}`
                    }
                });
                self.HotAreaData = response.data[0].map((item, index) => ({
                    num: (index+1).toString(),
                    image: response.data[2][index],
                    name: response.data[0][index],
                    time: response.data[3]
                }));        
                // console.log('HotAreaData:', self.HotAreaData);
            }catch(error){
                console.log('GetHotArea error - ', error);
            }
        },
        async SwitchCard() {
            let self = this;
            if (self.counter === 0) {
                document.getElementById('sub_count_1').classList.add('active');
                document.getElementById('sub_count_2').classList.remove('active');
                self.counter = 1;
            } else {
                document.getElementById('sub_count_2').classList.add('active');
                document.getElementById('sub_count_1').classList.remove('active');
                self.counter = 0;
            }
        }
    }
});