import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, ProgressBar, Image } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faDollarSign,
  faClipboardList,
  faComments,
  faEllipsisV,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

// Chart.js and react-chartjs-2 imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

// Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // Sample data for the area (line) chart
// const areaChartData = {
//   labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
//   datasets: [
//     {
//       label: "Earnings",
//       data: [40000, 60000, 80000, 55000, 65000, 75000, 90000],
//       fill: true,
//       tension: 0.4,
//     },
//   ],
// };

// const areaChartOptions = {
//   responsive: true,
//   plugins: {
//     legend: { display: false },
//     title: { display: false },
//   },
//   scales: {
//     x: { grid: { display: false } },
//     y: { grid: { color: "#e9ecef" } },
//   },
// };

// // Sample data for the pie chart
// const pieChartData = {
//   labels: ["Direct", "Social", "Referral"],
//   datasets: [
//     {
//       data: [55, 30, 15],
//     },
//   ],
// };

// const pieChartOptions = {
//   responsive: true,
//   plugins: {
//     legend: { position: "bottom" },
//     title: { display: false },
//   },
// };

function Dashboard() {
  return (
    <Container fluid>
      <Row>
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow-sm h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Participants
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                  Placeholder
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    size="2x"
                    className="text-gray-300"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-success shadow-sm h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Earnings (Annual)
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    Placeholder
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon
                    icon={faDollarSign}
                    size="2x"
                    className="text-gray-300"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-info shadow-sm h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Tasks
                  </div>
                  <Row className="no-gutters align-items-center">
                    <Col xs="auto">
                      <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">
                        50%
                      </div>
                    </Col>
                    <Col>
                      <ProgressBar now={50} variant="info" />
                    </Col>
                  </Row>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    size="2x"
                    className="text-gray-300"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-left-warning shadow-sm h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Unpaid Participants
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    18
                  </div>
                </Col>
                <Col xs="auto">
                  <FontAwesomeIcon
                    icon={faComments}
                    size="2x"
                    className="text-gray-300"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts section */}
      {/* <Row>
        <Col xl={8} lg={7} className="mb-4">
          <Card className="shadow">
            <Card.Header className="py-3 d-flex align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">
                Earnings Overview
              </h6>
              <FontAwesomeIcon icon={faEllipsisV} className="text-gray-400" />
            </Card.Header>
            <Card.Body>
              <Line data={areaChartData} options={areaChartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4} lg={5} className="mb-4">
          <Card className="shadow">
            <Card.Header className="py-3 d-flex align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">
                Revenue Sources
              </h6>
              <FontAwesomeIcon icon={faEllipsisV} className="text-gray-400" />
            </Card.Header>
            <Card.Body>
              <Doughnut data={pieChartData} options={pieChartOptions} />
              <div className="mt-4 text-center small">
                <span className="me-2">
                  <FontAwesomeIcon icon={faCircle} className="text-primary" />{" "}
                  Direct
                </span>
                <span className="me-2">
                  <FontAwesomeIcon icon={faCircle} className="text-success" />{" "}
                  Social
                </span>
                <span className="me-2">
                  <FontAwesomeIcon icon={faCircle} className="text-info" />{" "}
                  Referral
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Projects progress */}
      {/* <Row>
        <Col lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Projects</h6>
            </Card.Header>
            <Card.Body>
              {[
                { name: "Server Migration", now: 20, variant: "danger" },
                { name: "Sales Tracking", now: 40, variant: "warning" },
                { name: "Customer Database", now: 60, variant: undefined },
                { name: "Payout Details", now: 80, variant: "info" },
                {
                  name: "Account Setup",
                  now: 100,
                  variant: "success",
                  label: "Complete!",
                },
              ].map((proj, idx) => (
                <React.Fragment key={idx}>
                  <div className="small font-weight-bold d-flex justify-content-between">
                    <span>{proj.name}</span>
                    <span>{proj.label ?? `${proj.now}%`}</span>
                  </div>
                  <ProgressBar
                    now={proj.now}
                    variant={proj.variant}
                    className="mb-4"
                    label=""
                  />
                </React.Fragment>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Illustrations
              </h6>
            </Card.Header>
            <Card.Body className="text-center">
              <Image
                fluid
                src="/img/undraw_posting_photo.svg"
                alt="undraw"
                style={{ maxWidth: "25rem" }}
              />
              <p className="mt-3">
                Add quality svg illustrations courtesy of{" "}
                <a
                  href="https://undraw.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  unDraw
                </a>
                .
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}
    </Container>
  );
}

export default Dashboard;
