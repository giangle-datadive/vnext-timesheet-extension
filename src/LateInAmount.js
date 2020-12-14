import React, { useEffect, useState, useMemo } from "react";

const getCookies = function () {
  const pairs = document.cookie.split(";");
  const cookies = {};
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i].split("=");
    cookies[(pair[0] + "").trim()] = unescape(pair.slice(1).join("="));
  }
  return cookies;
};

const token = getCookies()["VERP-TOKEN"];

const OPTIONS = {
  FIRST_SIX_MONTHS: 1,
  LAST_SIX_MONTHS: 2,
  ALL_TIME: 3,
}

const LateInAmount = () => {
  const [timeRange, setTimeRange] = useState(() => {
    const now = new Date();
    const isFirstOfSixMonth = now.getMonth() <= 5;
    if (isFirstOfSixMonth) {
      return OPTIONS.FIRST_SIX_MONTHS;
    }

    return OPTIONS.LAST_SIX_MONTHS;
  });
  const [total, setTotal]= useState(1000);
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
  
    if(timeRange === OPTIONS.FIRST_SIX_MONTHS) {
      const lastDayOfJune = new Date();
      return {
        from: `${currentYear}-1-1`,
        to: `${currentYear}-6-30`,
        pageSize: 9999,
      }
    }

    if(timeRange === OPTIONS.LAST_SIX_MONTHS) {
      return {
        from:  `${currentYear}-7-1`,
        to: `${currentYear}-12-31`,
        pageSize: 9999,
      }
    }

    return {
      from: `${currentYear}-1-1`,
      to: `${currentYear}-12-31`,
      pageSize: 9999,
    }
  }, [timeRange])

  useEffect(() => {
    const url = new URL('https://api-erp.vnext.vn/tsm/timesheet/attendances/me');
    Object.keys(query).forEach(key => {
      url.searchParams.append(key, query[key])
    });
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    
    fetch(url, { headers }).then(res => res.json()).then(data => {
      const total = data.reduce((total, item) => total + +item.late_in_fine, 0);
      setTotal(total);
    })
  }, [timeRange]);

  const onTimeRangeChange = (e) => {
    setTimeRange(+e.target.value);
  }


  return (
    <div>
      <h5 className="ui header">Tiền đi muộn</h5>
      <div>
        <select onChange={onTimeRangeChange} value={timeRange}>
          <option value={OPTIONS.FIRST_SIX_MONTHS}>6 Tháng đầu năm</option>
          <option value={OPTIONS.LAST_SIX_MONTHS}>6 Tháng cuối năm</option>
          <option value={OPTIONS.ALL_TIME}>Cả năm</option>
        </select>
      </div>
      <div
        role="list"
        style={{
          color: 'red',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
        className="ui divided relaxed list"
      >
        {total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
};

export default LateInAmount;