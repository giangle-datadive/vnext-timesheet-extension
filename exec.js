const getCookies = function () {
  const pairs = document.cookie.split(";");
  const cookies = {};
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i].split("=");
    cookies[(pair[0] + "").trim()] = unescape(pair.slice(1).join("="));
  }
  return cookies;
};

const changeValue = (element, value) => {
  const event = new Event('input', { bubbles: true })
  element.value = value
  element.dispatchEvent(event)
}

const getCurrentDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  const years = date.getFullYear();
  const month = date.getMonth().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${years}-${month}-${day}`;
};

const getStartDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return month < 6 ? `${year}-1-1` : `${year}-7-1`;
};

const token = getCookies()["VERP-TOKEN"];
const headers = {
  Authorization: `Bearer ${token}`,
};

fetch(
  `https://api-erp.vnext.vn/tsm/timesheet/attendances/me?from=${getStartDate()}&to=${getCurrentDate()}&pageSize=9999`,
  { headers }
)
  .then((res) => res.json())
  .then((data) => {
    const total = data.reduce((total, item) => total + +item.late_in_fine, 0);
    const sidebar = document.querySelector(".four");
    const div = document.createElement("div");
    div.className = "ui segment";
    div.innerHTML = `
      <h5 class="ui header">Tiền đi muộn</h5>
      <div role="list" style="color: red;font-size:18px;font-weight: bold;" class="ui divided relaxed list">${total.toLocaleString(
        "en-US",
        { maximumFractionDigits: 2 }
      )}</div>
    `;
    sidebar.appendChild(div);
  });

const diffInHours = (start, end) => {
  const startDate =  new Date();
  const endDate = new Date();
  const [startHours, startMinutes] = start.split(':');
  const [endHours, endMinutes] = end.split(':');
  startDate.setHours(+startHours, +startMinutes);
  endDate.setHours(+endHours, +endMinutes);
  const value = (endDate.getTime() - startDate.getTime()) / 3600000;

  return Math.floor(value * 10) / 10;
};

// OT request helper
let isActiveOTTab = false;
const callback = () => {
  const OTTab = document.querySelector('.modals .header .ui:nth-child(5)');
  if(OTTab && [...OTTab.classList].includes('positive') && !isActiveOTTab) {
    isActiveOTTab = true
    isActiveOTTab = true;
    const currentDateString = document.querySelector('.content .form .fields .field:nth-child(1) input').value;
    const currentDate = new Date(currentDateString);
    const startTimeAndEndTime = document.querySelector('.log-overtime span').textContent;
    let [startTime, endTime] = startTimeAndEndTime.split('-').map(text => text.trim());
    const isWeekend = [0, 6].includes(currentDate.getDay());
    if (!isWeekend) {
      startTime = '18:00';
    }
    let hours = diffInHours(startTime, endTime);
    const hourInput = document.querySelector('.content .form .field:nth-child(2) input');
    if(isWeekend) {
      hours = hours - 1;
      if (hourInput.parentNode.querySelector('.warning-text')) {
        return;
      }
      const div = document.createElement('div');
      div.className = 'warning-text';
      div.textContent = 'Đã trừ 1 tiếng vào ngày cuối tuần'
      div.style.color = 'red';
      div.style.marginTop = '4px';
      div.style.fontWeight = 'bold';
      hourInput.parentNode.appendChild(div);
      hourInput.parentNode.style.display = 'flex';
      hourInput.parentNode.style.flexDirection = 'column';
    }
    if (hours < 0 || hourInput.value) {
      return
    }
    // Fill startime
    if(!isWeekend) {
      const startInput = document.querySelector('.content .form .field:nth-child(1) input');
      const startTime = startInput.value.replace(/[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$/, "18:00:00");
      changeValue(startInput, startTime);
    }
    
    changeValue(hourInput, hours);
    hourInput.value = hours;
    hourInput.addEventListener('focus', () => {
      if (hourInput.value) {
        return;
      }
      changeValue(hourInput, hours);
    });
    return;
  }

  if(!OTTab || ![...OTTab.classList].includes('positive')) {
    isActiveOTTab = false
  }
};

const observer = new MutationObserver(callback);
observer.observe(document.body, { attributes: true, childList: true, subtree: true });

