import React from "react";
import "./App.css";
import Chart from "react-apexcharts";
import { Header, Button, Grid, Select } from "semantic-ui-react";
import { toInteger } from "lodash";
const { ipcRenderer } = window.require("electron");

class App extends React.Component {
  constructor(props) {
    super(props);

    this.handleLoadConfig = this.handleLoadConfig.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
    this.handleSelectedGroupChange = this.handleSelectedGroupChange.bind(this);

    this.state = {
      configLoaded: false,
      dataLoaded: false,
      groupSelected: false,
      selectedGroup: null,
    };

    this.options = {
      config: {},
      groups: [],
      series: {},
      numResponses: 0,
      numGroupResponses: {},
      invalidResponses: 0,
      chart: {
        height: 350,
        type: "scatter",
        zoom: {
          enabled: true,
          type: "xy",
        },
      },
      legend: {
        onItemClick: {
          toggleDataSeries: true,
        },
      },
      xaxis: {
        tickAmount: 10,
        min: 0,
        max: 10,
        title: {
          text: "Know-How",
        },
      },
      yaxis: {
        tickAmount: 10,
        min: 0,
        max: 10,
        title: {
          text: "Herausforderung",
        },
      },
    };
  }

  hasValue(key, value, data) {
    for (let element of data) {
      if (element[key] === value) {
        return true;
      }
    }
    return false;
  }

  handleSelectedGroupChange(event, data) {
    console.log("Selected Team: " + data.value);
    this.setState({
      selectedGroup: data.value,
      groupSelected: true,
    });
  }

  handleLoadConfig(event) {
    ipcRenderer.invoke("app:on-fs-dialog-open").then((jsonData) => {
      this.options.config = jsonData;

      this.setState({
        configLoaded: true,
      });
    });
  }

  handleLoadData(event) {
    ipcRenderer.invoke("app:on-fs-dialog-open").then((jsonData) => {
      let data = {};
      let numResponses = 0;
      let numGroupResponses = {};
      let invalidResponses = 0;

      // Get all Groups
      let groups = [];
      for (let response of jsonData.responses) {
        if (
          !this.hasValue(
            "key",
            response[this.options.config.group_code],
            groups
          )
        ) {
          console.log(
            "Adding Group " + response[this.options.config.group_code]
          );
          groups.push({
            key: response[this.options.config.group_code],
            text: response[this.options.config.group_code],
            value: response[this.options.config.group_code],
          });
        }
      }

      for (let group_name of groups) {
        data[group_name.key] = [];
        numGroupResponses[group_name.key] = 0;
        for (let domain_code of this.options.config.domain_codes) {
          data[group_name.key].push({
            name: this.options.config.domain_names[domain_code],
            data: [],
          });
        }
      }

      for (let response of jsonData.responses) {
        let invalid = false;

        numResponses += 1;
        numGroupResponses[response[this.options.config.group_code]] += 1;

        for (let indx in this.options.config.domain_codes) {
          let x_value =
            response[
              this.options.config.question_codes[0] +
                "[" +
                this.options.config.domain_codes[indx] +
                "]"
            ];
          let y_value =
            response[
              this.options.config.question_codes[1] +
                "[" +
                this.options.config.domain_codes[indx] +
                "]"
            ];
          if (x_value && y_value) {
            data[response[this.options.config.group_code]][indx].data.push([
              toInteger(x_value),
              toInteger(y_value),
            ]);
          } else {
            invalid = true;
          }
        }
        if (invalid) {
          invalidResponses += 1;
        }
      }

      this.options.groups = groups;
      this.options.series = data;
      this.options.numResponses = numResponses;
      this.options.invalidResponses = invalidResponses;
      this.options.numGroupResponses = numGroupResponses;

      this.setState({
        dataLoaded: true,
      });
    });
  }

  handleSaveImage(event) {
    ipcRenderer.invoke("app:on-fs-dialog-save").then((jsonData) => {});
  }

  getData(group) {
    console.log(this.options.series);
    if (this.options.series[group]) {
      return this.options.series[group];
    } else {
      console.log("return nothing");
      return [];
    }
  }

  getNumResponses(group) {
    console.log(this.options.series);
    if (this.options.numGroupResponses[group]) {
      return this.options.numGroupResponses[group];
    } else {
      console.log("return 0");
      return 0;
    }
  }

  render() {
    return (
      <div className="app">
        <p />
        <Header as="h1" textAlign="center">
          Team-Knowlege-Model
        </Header>
        <p />
        <Grid columns={2} divided>
          <Grid.Row>
            <Grid.Column width={3}>
              <Button
                content="Lade Config"
                fluid
                onClick={this.handleLoadConfig}
              />
              <p />
              <Button
                content="Lade Daten"
                fluid
                onClick={this.handleLoadData}
                disabled={!this.state.configLoaded}
              />
              <p />
              <Select
                placeholder="Team auswählen"
                fluid
                options={this.options.groups}
                onChange={this.handleSelectedGroupChange}
                disabled={!this.state.dataLoaded}
              />
              <p />
              Antworten: {this.getNumResponses(this.state.selectedGroup)}
              <p />
              Gesamt: {this.options.numResponses}
              <p />
              Ungültig: {this.options.invalidResponses}
            </Grid.Column>
            <Grid.Column width={10}>
              <div className="row">
                <div className="mixed-chart">
                  <Chart
                    options={this.options}
                    series={this.getData(this.state.selectedGroup)}
                    type="scatter"
                  />
                </div>
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default App;
