// 云函数入口文件
import axios, { AxiosRequestConfig } from 'axios'

// 云函数入口函数
export async function main (event: AxiosRequestConfig) {
  const res = await axios({
    timeout: 2000,
    ...event
  })
  return {
    status: res.status,
    headers: res.headers,
    data: res.data
  }
}
