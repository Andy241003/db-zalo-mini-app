import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any
import json
import traceback

class ErrorHandler:
    """
    Centralized error handling and monitoring
    """
    
    def __init__(self):
        self.error_logger = logging.getLogger("error_handler")
        
        # Create file handler if not exists
        if not self.error_logger.handlers:
            handler = logging.FileHandler("logs/errors.log")
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.error_logger.addHandler(handler)
        
        self.error_counts = {}
        self.critical_errors = []
    
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handle and log errors with context"""
        
        error_type = type(error).__name__
        error_message = str(error)
        
        # Create error record
        error_record = {
            "timestamp": time.time(),
            "error_type": error_type,
            "error_message": error_message,
            "traceback": "".join(traceback.format_exception(type(error), error, error.__traceback__)),
            "context": context or {},
            "severity": self._determine_severity(error)
        }
        
        # Log error
        self.error_logger.error(f"ERROR: {json.dumps(error_record)}")
        
        # Track error counts
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        # Store critical errors
        if error_record["severity"] == "critical":
            self.critical_errors.append(error_record)
            
            # Keep only last 100 critical errors
            if len(self.critical_errors) > 100:
                self.critical_errors = self.critical_errors[-100:]
        
        return error_record
    
    def _determine_severity(self, error: Exception) -> str:
        """Determine error severity"""
        
        critical_errors = [
            "DatabaseError", "ConnectionError", "TimeoutError",
            "MemoryError", "SystemError"
        ]
        
        high_errors = [
            "ValidationError", "AuthenticationError", "PermissionError",
            "SecurityError", "IntegrityError"
        ]
        
        error_type = type(error).__name__
        
        if error_type in critical_errors:
            return "critical"
        elif error_type in high_errors:
            return "high"
        else:
            return "medium"
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """Get error statistics"""
        
        total_errors = sum(self.error_counts.values())
        
        return {
            "total_errors": total_errors,
            "error_counts": self.error_counts,
            "critical_errors_count": len(self.critical_errors),
            "recent_critical_errors": self.critical_errors[-10:] if self.critical_errors else []
        }
    
    def reset_statistics(self):
        """Reset error statistics"""
        self.error_counts = {}
        self.critical_errors = []


class AlertSystem:
    """
    Alert system for monitoring critical events
    """
    
    def __init__(self):
        self.alert_logger = logging.getLogger("alert_system")
        
        # Create file handler if not exists
        if not self.alert_logger.handlers:
            handler = logging.FileHandler("logs/alerts.log")
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.alert_logger.addHandler(handler)
        
        self.active_alerts = {}
        self.alert_history = []
    
    def trigger_alert(self, alert_type: str, message: str, severity: str = "medium", metadata: Dict[str, Any] = None):
        """Trigger an alert"""
        
        alert = {
            "alert_id": f"{alert_type}_{int(time.time())}",
            "alert_type": alert_type,
            "message": message,
            "severity": severity,
            "timestamp": time.time(),
            "metadata": metadata or {},
            "status": "active"
        }
        
        # Store active alert
        self.active_alerts[alert["alert_id"]] = alert
        
        # Add to history
        self.alert_history.append(alert)
        
        # Keep only last 1000 alerts in history
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]
        
        # Log alert
        self.alert_logger.warning(f"ALERT: {json.dumps(alert)}")
        
        # For critical alerts, you might want to send notifications
        if severity == "critical":
            self._handle_critical_alert(alert)
    
    def _handle_critical_alert(self, alert: Dict[str, Any]):
        """Handle critical alerts - send notifications"""
        
        # In production, you would integrate with:
        # - Email notifications
        # - Slack/Teams webhooks
        # - SMS alerts
        # - PagerDuty/OpsGenie
        
        self.alert_logger.critical(f"CRITICAL_ALERT_NOTIFICATION: {json.dumps(alert)}")
    
    def resolve_alert(self, alert_id: str):
        """Mark an alert as resolved"""
        
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id]["status"] = "resolved"
            self.active_alerts[alert_id]["resolved_at"] = time.time()
            
            # Remove from active alerts
            del self.active_alerts[alert_id]
    
    def get_active_alerts(self) -> Dict[str, Any]:
        """Get all active alerts"""
        return self.active_alerts
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary"""
        
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        for alert in self.active_alerts.values():
            severity = alert.get("severity", "medium")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            "total_active_alerts": len(self.active_alerts),
            "severity_counts": severity_counts,
            "recent_alerts": self.alert_history[-20:] if self.alert_history else []
        }


class SystemMonitor:
    """
    System-wide monitoring and alerting
    """
    
    def __init__(self):
        self.error_handler = ErrorHandler()
        self.alert_system = AlertSystem()
        self.start_time = time.time()
        
    def monitor_tenant_activities(self, tenant_id: str, activity_count: int, time_window: int = 60):
        """Monitor tenant activities for suspicious patterns"""
        
        # Define thresholds
        normal_threshold = 100  # requests per minute
        suspicious_threshold = 500
        critical_threshold = 1000
        
        if activity_count > critical_threshold:
            self.alert_system.trigger_alert(
                alert_type="tenant_activity_critical",
                message=f"Tenant {tenant_id} has {activity_count} activities in {time_window}s - possible DoS attack",
                severity="critical",
                metadata={"tenant_id": tenant_id, "activity_count": activity_count, "time_window": time_window}
            )
        elif activity_count > suspicious_threshold:
            self.alert_system.trigger_alert(
                alert_type="tenant_activity_high",
                message=f"Tenant {tenant_id} has {activity_count} activities in {time_window}s - monitoring required",
                severity="high",
                metadata={"tenant_id": tenant_id, "activity_count": activity_count, "time_window": time_window}
            )
    
    def monitor_authentication_failures(self, client_ip: str, failure_count: int, time_window: int = 300):
        """Monitor authentication failures for brute force attacks"""
        
        if failure_count > 20:  # 20 failures in 5 minutes
            self.alert_system.trigger_alert(
                alert_type="brute_force_attack",
                message=f"Possible brute force attack from IP {client_ip}: {failure_count} failures in {time_window}s",
                severity="critical",
                metadata={"client_ip": client_ip, "failure_count": failure_count, "time_window": time_window}
            )
        elif failure_count > 10:
            self.alert_system.trigger_alert(
                alert_type="authentication_failures_high",
                message=f"High authentication failures from IP {client_ip}: {failure_count} failures in {time_window}s",
                severity="high",
                metadata={"client_ip": client_ip, "failure_count": failure_count, "time_window": time_window}
            )
    
    def monitor_error_rates(self, error_rate: float, time_window: int = 60):
        """Monitor application error rates"""
        
        if error_rate > 0.1:  # 10% error rate
            self.alert_system.trigger_alert(
                alert_type="high_error_rate",
                message=f"High error rate detected: {error_rate*100:.2f}% in {time_window}s",
                severity="critical",
                metadata={"error_rate": error_rate, "time_window": time_window}
            )
        elif error_rate > 0.05:  # 5% error rate
            self.alert_system.trigger_alert(
                alert_type="elevated_error_rate",
                message=f"Elevated error rate detected: {error_rate*100:.2f}% in {time_window}s",
                severity="high",
                metadata={"error_rate": error_rate, "time_window": time_window}
            )
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        
        uptime = time.time() - self.start_time
        
        return {
            "uptime_seconds": uptime,
            "error_statistics": self.error_handler.get_error_statistics(),
            "alert_summary": self.alert_system.get_alert_summary(),
            "timestamp": time.time()
        }


# Global instances
error_handler = ErrorHandler()
alert_system = AlertSystem()
system_monitor = SystemMonitor()
