import axios, { AxiosPromise } from "axios";
import * as qs from "querystring";

const apiUrl = "https://slack.com/api";
const username = "taskmaster";

class SlackApi {
  public sendSlackMessage(channel: string, text: string): AxiosPromise {
    const token = process.env.SLACK_ACCESS_TOKEN;
    const request = { token, channel, text, username };
    return axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(request));
  }

  public getChannelInfo(channel: string): AxiosPromise {
    const token = process.env.SLACK_ACCESS_TOKEN;
    const request = { token, channel };
    // For public channels is channels.info for private groups.info
    // TODO make it configurable
    return axios.get(`${apiUrl}/groups.info?${qs.stringify(request)}`);
  }
}

export default SlackApi;
