# automation_functions.py
from datetime import datetime, timedelta, time
from typing import Optional
import calendar

def calculate_next_run(schedule: str, schedule_details: dict, from_date: Optional[datetime] = None) -> datetime:
    if from_date is None:
        from_date = datetime.utcnow()
    
    # Get execution time or default to 7 AM
    execution_time = schedule_details.get('execution_time', time(7, 0))
    base_date = from_date.replace(
        hour=execution_time.hour,
        minute=execution_time.minute,
        second=0,
        microsecond=0
    )
    
    if schedule == "daily":
        next_run = base_date + timedelta(days=1)
        
    elif schedule == "weekly":
        day_of_week = schedule_details.get('day_of_week', 5)  # Default to Saturday (5)
        current_day = from_date.weekday()
        days_ahead = day_of_week - current_day
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        next_run = base_date + timedelta(days=days_ahead)
        
    elif schedule == "biweekly":
        day_of_week = schedule_details.get('day_of_week', 5)  # Default to Saturday (5)
        current_day = from_date.weekday()
        days_ahead = day_of_week - current_day
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 14  # Skip to next biweekly occurrence
        else:
            days_ahead += 7  # Add a week to get to next biweekly occurrence
        next_run = base_date + timedelta(days=days_ahead)
        
    elif schedule == "monthly":
        day_of_month = schedule_details.get('day_of_month', -1)  # -1 indicates last day
        
        if day_of_month == -1:
            # Calculate last day of next month
            if from_date.month == 12:
                next_month = 1
                next_year = from_date.year + 1
            else:
                next_month = from_date.month + 1
                next_year = from_date.year
                
            # Get the last day of next month
            _, last_day = calendar.monthrange(next_year, next_month)
            next_run = datetime(next_year, next_month, last_day, 
                              execution_time.hour, execution_time.minute)
        else:
            # Move to next month maintaining the specified day
            if from_date.month == 12:
                next_month = 1
                next_year = from_date.year + 1
            else:
                next_month = from_date.month + 1
                next_year = from_date.year
                
            # Ensure day exists in target month
            _, last_day = calendar.monthrange(next_year, next_month)
            target_day = min(day_of_month, last_day)
            
            next_run = datetime(next_year, next_month, target_day,
                              execution_time.hour, execution_time.minute)
    
    return next_run

