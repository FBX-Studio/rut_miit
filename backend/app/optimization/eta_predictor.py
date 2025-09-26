import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class ETAPredictor:
    """
    ETA Predictor using Random Forest and heuristic methods
    Predicts delivery times based on historical data and real-time factors
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = [
            'distance_km', 'traffic_factor', 'hour_of_day', 'day_of_week',
            'weather_factor', 'driver_experience', 'vehicle_type_encoded',
            'order_complexity', 'historical_avg_time'
        ]
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
    
    def predict_eta(
        self,
        distance_km: float,
        traffic_factor: float,
        current_time: datetime,
        driver_experience: float,
        vehicle_type: str,
        order_complexity: float = 1.0,
        weather_factor: float = 1.0
    ) -> Dict:
        """
        Predict ETA for a delivery
        
        Args:
            distance_km: Distance to destination in kilometers
            traffic_factor: Traffic multiplier (1.0 = normal, >1.0 = heavy traffic)
            current_time: Current timestamp
            driver_experience: Driver experience level (0-5 scale)
            vehicle_type: Type of vehicle
            order_complexity: Order complexity factor (1.0 = simple, >1.0 = complex)
            weather_factor: Weather impact factor (1.0 = normal, >1.0 = bad weather)
            
        Returns:
            Dictionary with ETA prediction and confidence
        """
        
        # If model is not trained, use heuristic method
        if not self.is_trained:
            return self._heuristic_prediction(
                distance_km, traffic_factor, current_time, 
                driver_experience, vehicle_type, order_complexity, weather_factor
            )
        
        # Prepare features for ML prediction
        features = self._prepare_features(
            distance_km, traffic_factor, current_time,
            driver_experience, vehicle_type, order_complexity, weather_factor
        )
        
        # Make prediction
        try:
            scaled_features = self.scaler.transform([features])
            predicted_minutes = self.model.predict(scaled_features)[0]
            
            # Get prediction confidence (using prediction intervals)
            confidence = self._calculate_confidence(scaled_features)
            
            eta_time = current_time + timedelta(minutes=predicted_minutes)
            
            return {
                "eta": eta_time,
                "travel_time_minutes": predicted_minutes,
                "confidence": confidence,
                "method": "ml_prediction",
                "factors": {
                    "distance_km": distance_km,
                    "traffic_factor": traffic_factor,
                    "weather_factor": weather_factor,
                    "driver_experience": driver_experience
                }
            }
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}, falling back to heuristic")
            return self._heuristic_prediction(
                distance_km, traffic_factor, current_time,
                driver_experience, vehicle_type, order_complexity, weather_factor
            )
    
    def _heuristic_prediction(
        self,
        distance_km: float,
        traffic_factor: float,
        current_time: datetime,
        driver_experience: float,
        vehicle_type: str,
        order_complexity: float,
        weather_factor: float
    ) -> Dict:
        """
        Heuristic-based ETA prediction when ML model is not available
        """
        
        # Base speed by vehicle type (km/h)
        base_speeds = {
            "motorcycle": 35,
            "car": 30,
            "van": 25,
            "truck": 20
        }
        
        base_speed = base_speeds.get(vehicle_type.lower(), 25)
        
        # Adjust speed based on factors
        adjusted_speed = base_speed
        adjusted_speed *= (1 / traffic_factor)  # Reduce speed for traffic
        adjusted_speed *= (1 / weather_factor)  # Reduce speed for bad weather
        
        # Driver experience factor (experienced drivers are faster)
        experience_multiplier = 0.8 + (driver_experience / 5) * 0.4  # 0.8 to 1.2
        adjusted_speed *= experience_multiplier
        
        # Calculate base travel time
        travel_time_hours = distance_km / adjusted_speed
        travel_time_minutes = travel_time_hours * 60
        
        # Add complexity factor (additional time for complex deliveries)
        complexity_minutes = (order_complexity - 1) * 10  # 0-20 extra minutes
        
        # Add service time (time spent at delivery location)
        service_time = 15 * order_complexity  # 15-30 minutes based on complexity
        
        total_minutes = travel_time_minutes + complexity_minutes + service_time
        
        # Add some randomness for uncertainty
        uncertainty_minutes = total_minutes * 0.1  # 10% uncertainty
        
        eta_time = current_time + timedelta(minutes=total_minutes)
        
        # Calculate confidence based on factors
        confidence = self._calculate_heuristic_confidence(
            traffic_factor, weather_factor, order_complexity
        )
        
        return {
            "eta": eta_time,
            "travel_time_minutes": total_minutes,
            "confidence": confidence,
            "method": "heuristic",
            "factors": {
                "base_speed": base_speed,
                "adjusted_speed": adjusted_speed,
                "distance_km": distance_km,
                "traffic_factor": traffic_factor,
                "weather_factor": weather_factor,
                "complexity_minutes": complexity_minutes,
                "service_time": service_time
            }
        }
    
    def _prepare_features(
        self,
        distance_km: float,
        traffic_factor: float,
        current_time: datetime,
        driver_experience: float,
        vehicle_type: str,
        order_complexity: float,
        weather_factor: float
    ) -> List[float]:
        """Prepare feature vector for ML prediction"""
        
        # Encode vehicle type
        vehicle_encoding = {
            "motorcycle": 1,
            "car": 2,
            "van": 3,
            "truck": 4
        }
        
        # Get historical average for this distance range
        historical_avg = self._get_historical_average(distance_km)
        
        features = [
            distance_km,
            traffic_factor,
            current_time.hour,
            current_time.weekday(),
            weather_factor,
            driver_experience,
            vehicle_encoding.get(vehicle_type.lower(), 2),
            order_complexity,
            historical_avg
        ]
        
        return features
    
    def _get_historical_average(self, distance_km: float) -> float:
        """Get historical average delivery time for similar distances"""
        # Simplified lookup - in production, this would query historical data
        if distance_km < 5:
            return 25  # 25 minutes average for short distances
        elif distance_km < 15:
            return 45  # 45 minutes for medium distances
        else:
            return 75  # 75 minutes for long distances
    
    def _calculate_confidence(self, scaled_features: np.ndarray) -> float:
        """Calculate prediction confidence based on model uncertainty"""
        if not hasattr(self.model, 'estimators_'):
            return 0.7  # Default confidence
        
        # Get predictions from all trees
        tree_predictions = [
            tree.predict(scaled_features)[0] 
            for tree in self.model.estimators_
        ]
        
        # Calculate standard deviation as uncertainty measure
        std_dev = np.std(tree_predictions)
        mean_pred = np.mean(tree_predictions)
        
        # Convert to confidence (lower std_dev = higher confidence)
        coefficient_of_variation = std_dev / (mean_pred + 1e-6)
        confidence = max(0.3, 1.0 - coefficient_of_variation)
        
        return min(0.95, confidence)
    
    def _calculate_heuristic_confidence(
        self,
        traffic_factor: float,
        weather_factor: float,
        order_complexity: float
    ) -> float:
        """Calculate confidence for heuristic predictions"""
        base_confidence = 0.8
        
        # Reduce confidence for high uncertainty factors
        if traffic_factor > 1.5:
            base_confidence -= 0.2
        if weather_factor > 1.3:
            base_confidence -= 0.15
        if order_complexity > 2.0:
            base_confidence -= 0.1
        
        return max(0.3, base_confidence)
    
    def train_model(self, training_data: pd.DataFrame) -> Dict:
        """
        Train the ML model with historical delivery data
        
        Args:
            training_data: DataFrame with columns matching feature_columns + 'actual_time_minutes'
            
        Returns:
            Training metrics
        """
        logger.info(f"Training ETA model with {len(training_data)} samples")
        
        # Prepare features and target
        X = training_data[self.feature_columns].values
        y = training_data['actual_time_minutes'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Calculate training metrics
        train_score = self.model.score(X_scaled, y)
        predictions = self.model.predict(X_scaled)
        mae = np.mean(np.abs(predictions - y))
        rmse = np.sqrt(np.mean((predictions - y) ** 2))
        
        logger.info(f"Model trained. R²: {train_score:.3f}, MAE: {mae:.2f}, RMSE: {rmse:.2f}")
        
        return {
            "r2_score": train_score,
            "mae": mae,
            "rmse": rmse,
            "samples_trained": len(training_data)
        }
    
    def update_model(self, new_data: pd.DataFrame) -> Dict:
        """
        Update model with new delivery data (incremental learning simulation)
        """
        if not self.is_trained:
            return self.train_model(new_data)
        
        # In a real implementation, this would use incremental learning
        # For now, we'll retrain with combined data
        logger.info(f"Updating model with {len(new_data)} new samples")
        
        # This is a simplified update - in production, you'd want proper incremental learning
        return self.train_model(new_data)
    
    def save_model(self, model_path: str):
        """Save trained model and scaler"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, model_path)
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """Load trained model and scaler"""
        try:
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            self.is_trained = model_data['is_trained']
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_trained = False
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance from trained model"""
        if not self.is_trained:
            return {}
        
        importance = self.model.feature_importances_
        feature_importance = dict(zip(self.feature_columns, importance))
        
        # Sort by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        return dict(sorted_features)
    
    def predict_batch(self, delivery_requests: List[Dict]) -> List[Dict]:
        """
        Predict ETAs for multiple deliveries in batch
        
        Args:
            delivery_requests: List of delivery request dictionaries
            
        Returns:
            List of ETA predictions
        """
        predictions = []
        
        for request in delivery_requests:
            try:
                prediction = self.predict_eta(**request)
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Batch prediction failed for request {request}: {e}")
                # Add fallback prediction
                predictions.append({
                    "eta": request.get("current_time", datetime.now()) + timedelta(minutes=60),
                    "travel_time_minutes": 60,
                    "confidence": 0.3,
                    "method": "fallback",
                    "error": str(e)
                })
        
        return predictions