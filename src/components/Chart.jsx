import React, { useRef } from "react";
import { useEffect } from "react";
import { IgrFinancialChart } from "igniteui-react-charts";
import { IgrFinancialChartModule } from "igniteui-react-charts";
IgrFinancialChartModule.register();

const Chart = ({ Symbol }) => {
    const chartRef = useRef(0);
    const typeBtnRef = useRef(0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );

    let testData = [];

    const midnight = new Date(today);
    midnight.setHours(0, 0, 0, 0);

    let ws = null;

    useEffect(() => {
        getDataAndUpdateChart(midnight, now, "1m");

        startWebSocketData("1m");

        return () => {
            stopWebSocketData();
        };
    }, []);

    const stopWebSocketData = () => {
        if (ws) {
            ws.close();
        }
    };

    const startWebSocketData = interval => {
        ws = new WebSocket(
            `wss://stream.binance.com:9443/ws/${Symbol.toLowerCase()}@kline_${interval}`
        );

        let data = [];

        ws.onmessage = e => {
            const dataJson = JSON.parse(e.data);

            if (interval === "1m") {

                data.push({
                    date: new Date(dataJson.k.t),
                    open: parseFloat(dataJson.k.o),
                    high: parseFloat(dataJson.k.h),
                    low: parseFloat(dataJson.k.l),
                    close: parseFloat(dataJson.k.c),
                    volume: parseFloat(dataJson.k.v)
                });

                if (
                    data.length > 2 &&
                    data[data.length - 2].date.getTime() !==
                    data[data.length - 1].date.getTime()
                ) {
                    // Compute the values for the candlestick chart

                    let newdata = {
                        date: null,
                        open: null,
                        close: null,
                        high: 0,
                        low: Infinity,
                        volume: 0
                    };

                    for (const point of data) {
                        newdata.date = point.date;

                        if (!newdata.open) {
                            newdata.open = point.open;
                        }
                        newdata.close = point.close;
                        newdata.high = Math.max(newdata.high, point.high);
                        newdata.low = Math.min(newdata.low, point.low);
                        newdata.volume = Math.max(newdata.volume, point.volume);
                    }

                    updateChart(newdata);

                    // Clear the stored data and innerCounter

                    data = [];
                }
            } else {
                const secData = {
                    date: new Date(dataJson.k.t),
                    open: parseFloat(dataJson.k.o),
                    high: parseFloat(dataJson.k.h),
                    low: parseFloat(dataJson.k.l),
                    close: parseFloat(dataJson.k.c),
                    volume: parseFloat(dataJson.k.v)
                };

                updateChart(secData);
            }
        };
    };

    const updateChart = newdata => {

        chartRef.current.dataSource.push(newdata);
        chartRef.current.notifyInsertItem(
            chartRef.current.dataSource,
            chartRef.current.dataSource.length - 1,
            newdata
        );
    };

    const getDataAndUpdateChart = (startTime, endTime, interval) => {
        const totalMilliseconds = endTime - startTime;
        const halfMilliseconds = Math.floor(totalMilliseconds / 2);

        const firstHalfEnd = new Date(startTime.getTime() + halfMilliseconds);
        const secondHalfStart = new Date(firstHalfEnd.getTime() + 1);

        const firstHalf = {
            start: startTime.getTime(),
            end: firstHalfEnd.getTime()
        };
        const secondHalf = {
            start: secondHalfStart.getTime(),
            end: endOfDay.getTime()
        };

        fetch(
            `https://api.binance.com/api/v3/uiKlines?symbol=${Symbol}&interval=${interval}&startTime=${firstHalf.start}&endTime=${firstHalf.end}&limit=1000`
        )
            .then(res => res.json())
            .then(firstHalfData => {
                fetch(
                    `https://api.binance.com/api/v3/uiKlines?symbol=${Symbol}&interval=${interval}&startTime=${secondHalf.start}&endTime=${secondHalf.end}&limit=1000`
                )
                    .then(res => res.json())
                    .then(secondHalfData => {
                        let newdata = [];

                        testData = [...firstHalfData, ...secondHalfData];

                        testData.forEach(item => {
                            newdata = [
                                ...newdata,
                                {
                                    date: new Date(item[0]),
                                    open: parseFloat(item[1]),
                                    high: parseFloat(item[2]),
                                    low: parseFloat(item[3]),
                                    close: parseFloat(item[4]),
                                    volume: parseFloat(item[5])
                                }
                            ];
                        });

                        chartRef.current.dataSource = newdata;
                    })
                    .catch(error => {
                        console.error(error);
                    });
            })
            .catch(error => {
                console.error(error);
            });
    };

    const handleClick = target => {
        // setBtn(target);

        switch (target) {
            case 0:
                stopWebSocketData();

                getDataAndUpdateChart(
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        now.getHours(),
                        now.getMinutes() - 30
                    ),
                    new Date(),
                    "1s"
                );

                startWebSocketData("1s");
                break;

            case 1:
                stopWebSocketData();

                getDataAndUpdateChart(midnight, now, "1m");
                startWebSocketData("1m");
                break;

            case 2:
                stopWebSocketData();

                getDataAndUpdateChart(
                    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
                    new Date(),
                    "15m"
                );
                break;

            case 3:
                stopWebSocketData();

                getDataAndUpdateChart(
                    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29),
                    new Date(),
                    "1h"
                );
                break;

            case 4:
                stopWebSocketData();

                getDataAndUpdateChart(
                    new Date(now.getFullYear(), now.getMonth() - 5, now.getDate()),
                    new Date(),
                    "1h"
                );
                break;

            case 5:
                stopWebSocketData();

                getDataAndUpdateChart(
                    new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
                    new Date(),
                    "1d"
                );
                break;

            case 6:

                chartRef.current.chartType = chartRef.current.chartType === 2 ? 4 : 2;
                typeBtnRef.current.innerText =
                    chartRef.current.chartType === 2 ? "Line" : "Candle";
                break;

            default:
                break;
        }
    };

    // function CustomTooltip(props) {
    //     const { item } = props;

    //     return (
    //         <div style={{ backgroundColor: 'white', border: '1px solid black', padding: '5px' }}>
    //             <div>Date: {item.date.toLocaleDateString()}</div>
    //             <div>Open: {item.open}</div>
    //             <div>High: {item.high}</div>
    //             <div>Low: {item.low}</div>
    //             <div>Close: {item.close}</div>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col p-2">
            <div
                className="w-full md:w-2/3 xl:w-1/2 my-6"
                style={{ height: "500px", width: "100%" }}
            >
                <div className="relative" style={{ height: "500px", width: "100%" }}>
                    <IgrFinancialChart
                        ref={chartRef}
                        // tooltipTemplate={CustomTooltip}
                        toolTipType="data"
                        xAxisAutoScale={false}
                        xAxisMod="time"
                        xAxisLabelVisibility="collapsed"
                        width="100%"
                        height="100%"
                        isToolbarVisible={false}
                        chartType={"Candle"}
                        chartTitle={Symbol}
                        titleAlignment="Left"
                        titleLeftMargin="25"
                        titleTopMargin="10"
                        titleBottomMargin="10"
                        subtitle="Binance - CryptoCoin Price, Currency in USD"
                        subtitleAlignment="Left"
                        subtitleLeftMargin="25"
                        subtitleTopMargin="5"
                        subtitleBottomMargin="10"
                        yAxisMode="numeric"
                        yAxisVisibility={true}
                        finalValueAnnotationsVisible={true}
                        zoomSliderType="None"
                        dataSource={testData}
                    />
                </div>
            </div>
            <div className="flex flex-wrap justify-around w-full my-6">
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(0)}
                >
                    Live
                </button>
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(1)}
                >
                    1D
                </button>
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(2)}
                >
                    1W
                </button>
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(3)}
                >
                    1M
                </button >
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(4)}
                >
                    6M
                </button >
                <button
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(5)}
                >
                    1Y
                </button >
                <button
                    ref={typeBtnRef}
                    className={
                        "bg-blue-500 text-white hover:bg-blue-800 hover:text-white font-bold my-2 py-2 px-4 rounded"}
                    onClick={() => handleClick(6)}
                >
                    Line
                </button >
            </div >
        </div >
    );
};

export default Chart;
