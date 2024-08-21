import React, { useEffect, useState } from 'react';
import styles from './index.module.less';
import ContributionJsonData from '@/contribution.json';

export type DataType = 'random' | 'github' | 'local';

// MonthItem 类型定义，表示月份项
export type MonthItem = { colspan: number; month: number; year: number };

// DateItem 类型定义，表示日期项
export type DateItem = {
  id?: number;
  date: string;
  count: number;
  intensity: number;
  ignore?: boolean;
  backgroundColor?: string;
};

export type ContributionChartProps = {
  contributions: DateItem[][];
  total: number;
};

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

// 星期映射表
const WeekMap: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat'
};

// 贡献程度颜色映射表
const levelColorMap: Record<number, string> = {
  0: '#f5f6f7',
  1: '#cdf4d3',
  2: '#9fe1b1',
  3: '#97d0a6',
  4: '#90b69c'
};

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

// 贡献图表组件
const ContributionChart: React.FC = () => {
  // 数据类型，可选值为 random、github 和 local
  let dataModel: DataType = 'local'; // random or github or local
  // 随机数据的起始日期
  const randomStartDate = '2023-08-20';
  // 随机数据的结束日期
  const randomEndDate = '2024-08-20';

  const username = 'waiterxiaoyy';

  // 贡献数据状态，使用 _ 来表示未使用的变量
  const [_, setContribution_data] = useState<DateItem[][] | undefined>();
  // 贡献次数总和状态
  const [total, setTotal] = useState(0);
  // 月份数据状态
  const [months, setMonths] = useState<MonthItem[]>();
  // 行数据状态
  const [rowData, setRowData] = useState<DateItem[][]>();

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

  // useEffect 钩子，在组件挂载后执行一次

  const getData = async (dataModel: DataType): Promise<DateItem[][] | null> => {
    // 初始化贡献数据数组
    let contributionData: DateItem[][] = [];
    // 如果使用随机数据
    if (dataModel === 'random') {
      // 生成随机贡献数据
      contributionData = generateContributionData();
    } else if (dataModel === 'github') {
      // 获取真实数据
      const result = await fetchData(username);
      if (!result) {
        return null;
      }
      contributionData = result[0];
      setTotal(result[1]);
    } else {
      // 使用本地数据
      contributionData = ContributionJsonData.contributions as unknown as DateItem[][];
      setTotal(ContributionJsonData.total as number);
    }
    setContribution_data(contributionData);
    return contributionData;
  };

  useEffect(() => {
    // 获取贡献数据
    getData(dataModel).then(contributionData => {
      // 如果贡献数据为空，则返回
      if (!contributionData) {
        return;
      }

      const map: Map<string, MonthItem> = new Map();
      // 初始化月份数据数组
      const monthsData: MonthItem[] = [];
      // 遍历贡献数据数组
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

      // 更新月份数据状态
      setMonths(monthsData);
      // 获取行数据
      getRowData(contributionData);
    });
  }, []);

  // 获取行数据函数
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
    // 更新行数据状态
    setRowData(rowResultData);
  };

  // 获取背景颜色函数
  const getBackgroundColor = (level: number): string => {
    // 从颜色映射表中获取背景颜色
    return levelColorMap[level] || '#ebedf0';
  };
  return (
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
  );
};

export default ContributionChart;
