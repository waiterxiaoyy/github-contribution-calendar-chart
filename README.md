
![Snipaste_2024-08-21_13-59-58.png](http://yiyang-site.oss-cn-guangzhou.aliyuncs.com/site/images/Snipaste_2024-08-21_13-59-58.png "Snipaste_2024-08-21_13-59-58.png")

可以说和Github官网的一模一样了。

我已经挂载在我的个人博客里，有兴趣可以去看看：[Yiyang Site Resume](http://43.138.216.51/resume)

并且已经开源了：
[Github开源地址](https://github.com/waiterxiaoyy/github-contribution-calendar-chart)

这里也推荐一下我的个人博客[Yiyang Site](http://43.138.216.51/)，后面有时间再和大家分享一些博客的细节。

看上面的效果图，我真的有这么多的Commit吗，其实没有哈哈哈，**组件其实支持动态获取数据的同时，也支持静态，甚至支持随机生成数据**。

下面我讲详细展开介绍一下实现思路，我尽量每行都进行了注释，非常易懂！

## 页面结构

这里主要是通过`table`实现的，分为`thead`和`tbody`，`thead`用来渲染月份， `tbody`用来渲染每一天的commit数量。

```html
// 最外层容器，使用样式类 contributionChart
<div className={styles.contributionChart}>
  <div className={styles.content}>
    {/* 表格元素 */}
    <table>
      {/* 表格头部，使用样式类 thead */}
      <thead className={styles.thead}>
        {/* 表格头部第一行 */}
        <tr>
          {/* 第一个单元格，无内容，使用 id first-block */}
          <th id='first-block'></th>
          {/* 遍历 months 数组，每个元素对应一个月份的表头 */}
          {months?.map((item, index) => (
            // 每个表头单元格，使用 key 属性标识，使用 colSpan 属性指定跨列数，使用样式类 label
            <th key={index} colSpan={item.colspan} className={styles.label}>
              {/* 显示月份名称，使用 MonthMap 映射 */}
              <span>{MonthMap[item.month]}</span>
            </th>
          ))}
        </tr>
      </thead>
      {/* 表格主体，使用样式类 tbody */}
      <tbody className={styles.tbody}>
        {/* 遍历 rowData 数组，每个元素对应一行数据 */}
        {rowData?.map((items, index) => (
          // 每一行，使用 key 属性标识
          <tr key={index}>
            {/* 第一个单元格，显示星期，使用样式类 label，设置宽度为 30px */}
            <td className={styles.label} style={{ width: '30px' }}>
              {/* 使用 WeekMap 映射星期 */}
              {WeekMap[index]}
            </td>
            {/* 遍历 items 数组，每个元素对应一个日期的贡献数据 */}
            {items?.map(item => {
              // 判断是否忽略此日期的贡献数据
              if (!item.ignore) {
                // 不忽略，则显示贡献数据
                return (
                  // 贡献数据单元格，使用 data-date 属性标识日期，使用 key 属性标识，使用样式类 block，设置背景颜色
                  <td
                    data-date={item.date}
                    title={`${item.date} / ${item.count} contributions`}
                    key={item.date}
                    className={styles.block}
                    style={{
                      backgroundColor: `${item.backgroundColor}`
                    }}
                  ></td>
                );
              } else {
                // 忽略，则显示隐藏的单元格
                return <td key={item.id} className={`${styles.block} ${styles.hidden}`}></td>;
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div className={styles.tfoot}>
    {/* 描述信息，使用样式类 description */}
    <div className={styles.description}>Count Contributions: {total}</div>
    {/* 颜色说明，使用样式类 colors */}
    <div className={styles.colors}>
      Less
      {/* 遍历 levelColorMap 对象，每个键值对对应一个贡献度等级和颜色 */}
      {Object.entries(levelColorMap).map(([level, color]) => (
        // 颜色指示器，使用 key 属性标识，使用样式类 colorItem，设置背景颜色和间距
        <span key={level} className={styles.colorItem} style={{ backgroundColor: color, marginLeft: '4px' }}></span>
      ))}
      <div className={styles.moreText}>More</div>
    </div>
  </div>
</div>
```

上面可能涉及到一数据类型和结构，比如说`months`，以及`tbody`中的数据，这个我们一一分析，首先先看`months`是如何得到。

## 月份数据months

要看月份数据`months`是如何得到的，得先看接口返回的数据是怎么得到的。

我找了一圈，没有发现github的官方API，如果有大佬知道，可以在评论区告知一下。我最后是使用了国外大佬开源的一个API。链接：https://github.com/rschristian/github-contribution-calendar-api

可以很简单的使用：https://gh-calendar.rschristian.dev/user/{username}

这里返回的数据格式是：

```js
data: {
    contributions: [],
    total: 0,
}
```
`contributions`是一个二维对象数组，返回的是当前日期往52周以来的数据，比如今天是`2024-08-21`，其返回的数据是`2023-08-20`以来的数据，值得注意的是`2024-08-20`是星期日。`contributions`中的每个数组会存储7条数据，也就是一周的数据，比如`contributions`中的第一个数组的数据就是`2023-08-20`-`2023-08-26`的，而`2024-08-21`是在最后一个数组中，但是`2024-08-21`是星期三，所以这个数组只返回4条数据，如果到`2024-08-22`了，这个数组将有5条数据。

所以，他返回的是按周的数据，是过去52周以来的数据。每条数据都包含三个参数：`date`、`intensity`和`count`。
    
   - `date`代表日期
   - `intensity`是上面每一天的方块的颜色深度，只有五个值（0，1，2，3，4）
   - `count`是贡献数量

在此返回的基础上，我们对数据的属性和类型进行扩充，得到每条数据的类型：
```js
// DateItem 类型定义，表示日期项
export type DateItem = {
  id?: number;
  date: string; // 2024-08-20
  count: number;
  intensity: number;
  ignore?: boolean;
  backgroundColor?: string;
};
```

知道了数据类型，我们回到月份的获取，从数据的返回就能知道，每条数据都自带了年份和月份，而我们需要展示的月份一共是有13个月份，从去年8月到今年8月，每一列是一个星期，而要看有哪些月份，以及这个月份有其多少个星期，我们需要遍历`contributions`数组，去统计出现了哪些月份，以及`contributions`数组中每个星期数据的第一条数据是哪个月份的。

直接看代码或许能更容易理解一点：
```js
// 月份映射表
const MonthMap: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec'
};

const map: Map<string, MonthItem> = new Map();
// 初始化月份数据数组
const monthsData: MonthItem[] = [];
// 遍历贡献数据数组，contributionData是数据
for (const item of contributionData) {
    // 获取日期
    const date = item[0].date;
    // 分割日期字符串，获取年和月
    const [year, month] = date.split('-');
    // 拼接年和月，作为键值
    const key = year + month;

    // 从月份映射表中获取已有月份项
    const existingMonth = map.get(key);

    // 如果已有月份项
    if (existingMonth) {
      // 将月份项的 colspan 加 1
      existingMonth.colspan += 1;
    } else {
      // 创建新的月份项
      const month_tmp: MonthItem = { colspan: 1, month: Number(month), year: Number(year) };
      // 将新的月份项添加到月份映射表中
      map.set(key, month_tmp);
      // 将新的月份项添加到月份数据数组中
      monthsData.push(month_tmp);
    }
}
```

这样就能得到`months`数据，并且每个月份应该占据多少列都得到了。

## 每日数据

对于`tbody`中的方块如何渲染呢，首先我们上面说过了，每列是一个星期的数据，如果根据每列去遍历，其实不方便我们绘制图像，但是我们可以**根据每行去绘制图像**。

第一行第一个方块就是第一个星期的星期日数据，第一行第二个方块是第二个星期的星期日的数据，所以一共有7行（因为一个星期7天），一行有多少个就看返回了多少个星期的数据，因此，我们可以很容易的得到每日的数据。

这里还需要注意的时候，刚刚我们介绍数据的时候说了，今天是`2024-08-21`是星期三，在最后一个数组中，但是这个数组只返回了4条数据（日,一,二,三），所以我们需要对其进行处理，这也是为什么我们在上面的数据属性中增加了一个`ignore`属性，就是如果还没有返回的数据（四，五，六），则让其跳过不显示。

代码如下：

```js
// 获取行数据函数,data就是contribution数组
  const getRowData = async (data: DateItem[][]) => {
    // 初始化行数据数组
    const rowResultData: DateItem[][] = [];
    // 遍历一周
    for (let i = 0; i < 7; i++) {
      // 初始化行数据数组
      const rowDataTmp: DateItem[] = [];
      // 遍历贡献数据数组
      for (let j = 0; j < data.length; j++) {
        // 如果当前行数据存在
        if (data[j].length > i) {
          // 将当前行数据添加到行数据数组中
          rowDataTmp.push({
            ...data[j][i],
            ignore: false,
            backgroundColor: getBackgroundColor(Number(data[j][i].intensity) ? Number(data[j][i].intensity) : 0)
          });
        } else {
          // 如果当前行数据不存在，则添加空数据
          rowDataTmp.push({
            id: Math.random(),
            date: '',
            count: 0,
            intensity: 0,
            ignore: true,
            backgroundColor: getBackgroundColor(0)
          });
        }
      }
      // 将行数据添加到行数据数组中
      rowResultData.push(rowDataTmp);
    }
  };
```

## 颜色深度选取

颜色是根据`intensity`去得到的，写一个函数即可

```js
// 贡献程度颜色映射表
const levelColorMap: Record<number, string> = {
  0: '#f5f6f7',
  1: '#cdf4d3',
  2: '#9fe1b1',
  3: '#97d0a6',
  4: '#90b69c'
};

 // 获取背景颜色函数
const getBackgroundColor = (level: number): string => {
    // 从颜色映射表中获取背景颜色
    return levelColorMap[level] || '#ebedf0';
};
```

基本上数据的渲染就已经介绍完了，css代码的书写我放在文末最后，也可以直接去github上面看。

上面介绍了动态获取数据，但是毕竟这个接口不是官方的，随时可能挂掉，所以还是要支持本地静态数据。

## 不同的数据来源

我提供多了两种模式，一种是根据数据格式去随机生成，一种是加载本地json数据。

### 随机生成

这里主要是列一下随机生成：

需要设置数据的模式为`random`，并且设置开始日期和结束日期，注意满足相隔一年并且开始日期是周日

```js
// 数据类型，可选值为 random、github 和 local
let dataModel: DataType = 'local'; // random or github or local
// 随机数据的起始日期
const randomStartDate = '2023-08-20';
// 随机数据的结束日期
const randomEndDate = '2024-08-20';
```

随机生成代码如下：
```js
// 生成随机贡献数据
  const generateContributionData = (): DateItem[][] => {
    // 获取起始日期和结束日期
    const startDate = new Date(randomStartDate);
    const endDate = new Date(randomEndDate);
    // 初始化贡献数据数组
    const contributionData: DateItem[][] = [];

    // 格式化日期
    function formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 初始化当前日期为起始日期
    let currentDate = startDate;
    // 初始化贡献次数总和为 0
    let total = 0;

    // 遍历日期范围
    while (currentDate <= endDate) {
      // 初始化每周数据数组
      const weekData: Array<{ date: string; intensity: number; count: number }> = [];
      // 遍历一周
      for (let i = 0; i < 7; i++) {
        // 如果当前日期超过结束日期，则退出循环
        if (currentDate > endDate) break;
        // 随机生成贡献次数
        const count = Math.floor(Math.random() * 11);
        // 更新贡献次数总和
        total += count;
        // 将日期、贡献强度和贡献次数添加到每周数据数组中
        weekData.push({
          date: formatDate(currentDate),
          intensity: Math.floor(Math.random() * 5),
          count: count
        });

        // 将当前日期加 1 天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // 将每周数据添加到贡献数据数组中
      contributionData.push(weekData);
    }
    // 更新贡献次数总和状态
    setTotal(total);
    // 返回生成的贡献数据数组
    return contributionData;
  };
```

### 动态接口

```js
// 请求真实github贡献的接口，具体参考https://github.com/rschristian/github-contribution-calendar-api
const fetchData = async (username: string): Promise<[DateItem[][], number] | null> => {
  try {
    const response = await fetch(`https://gh-calendar.rschristian.dev/user/${username}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: ContributionChartProps = (await response.json()) as unknown as ContributionChartProps;
    return data ? [data.contributions, data.total] : null;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return null;
  }
};
```

### 加载本地json

本地json数据不多介绍，我放了一份数据在github中，可以自行去查看。

至此全部的逻辑都已经介绍完毕，这里放上完整的CSS代码：

```css
.contributionChart {
    width: 100%;
    padding: 20px;
    
    .content {
      table {
        border-spacing: 3px;
        width: 100%;
        white-space: nowrap;
      }
      th,
      td {
        box-sizing: border-box;
        background-color: transparent;
        width: 10px;
        height: 10px;
        box-sizing: border-box;
        line-height: 1;
        padding: 0;
        font-size: 12px;
        cursor: pointer;
      }
      th {
        text-align: left;
        color: #333;
        font-weight: 400;
        padding-bottom: 6px;
      }
      tr {
        font-weight: 300;
        height: 10px;
      }
      #first-block {
        width: 28px;
      }
      .block {
        border-radius: 2px;
        background-color: #efefef;
        &.hidden {
          background-color: transparent !important;
        }
      }
      .label {
        position: relative;
      }
      .tbody {
        .label span {
          position: absolute;
          top: 50%;
          transform: translate(0%, -50%);
        }
      }
    }
  
    .tfoot {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #333;
      font-size: 12px;
      color: #999;
      .description{
        padding-left: 30px;
      }
      .colors {
        display: flex;
        padding-right: 30px;
        align-items: center;
        .colorItem {
          width: 10px;
          height: 10px;
          display: inline-block;
        }
        .colorItem {
          margin-left: 4px;
        }
        .moreText {
          margin-left: 4px;
        }
      }
    }
  }

// 简单做了响应式适配
@media (max-width:550px) {
  .contributionChart {
    .content {
      thead {
        display: none;
      }
      .tbody {
        .label {
          font-size: 10px;
        }
      }
    }
  }
}
```
