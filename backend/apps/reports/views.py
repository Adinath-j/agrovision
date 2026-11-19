from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.farms.models import Farm
from apps.predictions.models import YieldPrediction
from apps.satellite.models import SatelliteObservation
from apps.market.models import MarketPrice
from apps.optimization.models import Recommendation
from .models import GeneratedReport

class YieldReportView(APIView):
    """
    Generates comprehensive Yield Prediction & Revenue Dossier for a farm parcel.
    Persists report record and provides structured dossier for print/export.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')

        if farm_id:
            farm = Farm.objects.filter(id=farm_id, owner=user).first()
        else:
            farm = Farm.objects.filter(owner=user).first()

        if not farm:
            return Response({"error": "No farm parcel found."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve predictions
        predictions = YieldPrediction.objects.filter(farm=farm).order_by('-created_at')
        latest_pred = predictions.first()

        # Retrieve satellite observation
        latest_sat = SatelliteObservation.objects.filter(farm=farm).order_by('-observation_date').first()

        # Retrieve market price for farm state
        market_p = MarketPrice.objects.filter(market__state__iexact=farm.state).first()
        modal_rate = float(market_p.modal_price_rs_per_quintal) if market_p else 4650.0

        area_ha = float(farm.area_hectares)
        predicted_yield = float(latest_pred.predicted_yield_kg_per_ha) if latest_pred else 2450.0
        total_prod_tonnes = float(latest_pred.predicted_total_production_tonnes) if latest_pred else round((predicted_yield * area_ha)/1000.0, 2)
        total_quintals = total_prod_tonnes * 10.0
        estimated_gross_revenue = round(total_quintals * modal_rate, 2)

        dossier = {
            "report_reference": f"AGRO-DOSS-{farm.id}-{latest_pred.id if latest_pred else '0'}",
            "generated_date": "2026-11-14",
            "farmer": {
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "phone": user.phone_number,
                "state": farm.state,
                "district": farm.district
            },
            "farm": {
                "id": farm.id,
                "name": farm.farm_name,
                "area_hectares": area_ha,
                "soil_type": farm.get_soil_type_display(),
                "soil_ph": float(farm.soil_ph) if farm.soil_ph else 7.2,
                "irrigation": farm.get_irrigation_method_display()
            },
            "yield_intelligence": {
                "crop": latest_pred.crop.name if latest_pred else "Soybean",
                "stage": latest_pred.get_stage_display() if latest_pred else "In-Season Live Update",
                "growth_stage": latest_pred.get_growth_stage_display() if latest_pred else "Flowering",
                "predicted_yield_kg_ha": predicted_yield,
                "total_production_tonnes": total_prod_tonnes,
                "interval_min_kg": float(latest_pred.prediction_interval_min_kg) if latest_pred and latest_pred.prediction_interval_min_kg else round(predicted_yield * 0.9, 1),
                "interval_max_kg": float(latest_pred.prediction_interval_max_kg) if latest_pred and latest_pred.prediction_interval_max_kg else round(predicted_yield * 1.1, 1),
                "confidence_score": float(latest_pred.confidence_score) if latest_pred and latest_pred.confidence_score else 86.0,
                "model_algorithm": latest_pred.model_algorithm if latest_pred else "XGBoost + Sentinel-2 Assimilation"
            },
            "remote_sensing": {
                "mission": "Sentinel-2 L2A BOA",
                "latest_ndvi": float(latest_sat.ndvi_mean) if latest_sat else 0.74,
                "canopy_vigour": latest_sat.vegetation_health_status if latest_sat else "Healthy Vegetative Canopy",
                "cloud_pct": float(latest_sat.cloud_coverage_pct) if latest_sat else 4.2
            },
            "market_valuation": {
                "benchmark_modal_price_per_qtl": modal_rate,
                "estimated_production_quintals": total_quintals,
                "gross_revenue_estimate_inr": estimated_gross_revenue,
                "mandi_reference": market_p.market.mandi_name if market_p else "Nashik APMC"
            }
        }

        # Persist report
        report_record = GeneratedReport.objects.create(
            farmer=user,
            farm=farm,
            report_type=GeneratedReport.ReportType.YIELD_SUMMARY,
            title=f"Yield Dossier: {dossier['yield_intelligence']['crop']} on {farm.farm_name}",
            summary_data=dossier
        )

        dossier["report_id"] = report_record.id

        return Response({
            "status": "success",
            "dossier": dossier
        })


class FarmReportView(APIView):
    """Comprehensive farm audit report including soil score, recommendations, and status."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        farm_id = request.query_params.get('farm_id')

        if farm_id:
            farm = Farm.objects.filter(id=farm_id, owner=user).first()
        else:
            farm = Farm.objects.filter(owner=user).first()

        if not farm:
            return Response({"error": "No farm parcel found."}, status=status.HTTP_404_NOT_FOUND)

        recs = Recommendation.objects.filter(farm=farm)
        completed_recs = recs.filter(is_implemented=True).count()

        # Calculate Soil Health Index (0-100)
        ph = float(farm.soil_ph) if farm.soil_ph else 7.0
        ph_score = 30 if 6.5 <= ph <= 7.8 else 15
        n_score = 25 if farm.nitrogen_n and float(farm.nitrogen_n) >= 200 else 15
        p_score = 25 if farm.phosphorus_p and float(farm.phosphorus_p) >= 15 else 15
        k_score = 20 if farm.potassium_k and float(farm.potassium_k) >= 200 else 10
        soil_health_index = ph_score + n_score + p_score + k_score

        audit = {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "district": farm.district,
            "state": farm.state,
            "area_hectares": float(farm.area_hectares),
            "soil_health_index": soil_health_index,
            "soil_health_rating": "Optimal Fertility" if soil_health_index >= 80 else "Moderate / Needs Amendment",
            "soil_parameters": {
                "soil_type": farm.get_soil_type_display(),
                "ph": ph,
                "n_kg_ha": float(farm.nitrogen_n) if farm.nitrogen_n else 220.0,
                "p_kg_ha": float(farm.phosphorus_p) if farm.phosphorus_p else 18.0,
                "k_kg_ha": float(farm.potassium_k) if farm.potassium_k else 270.0
            },
            "compliance_summary": {
                "total_recommendations": recs.count(),
                "implemented_count": completed_recs,
                "pending_count": recs.count() - completed_recs
            }
        }

        return Response({
            "status": "success",
            "farm_audit": audit
        })


class ReportListView(APIView):
    """List historical generated analytical reports."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reports = GeneratedReport.objects.filter(farmer=request.user).order_by('-generated_at')
        results = [
            {
                "id": r.id,
                "title": r.title,
                "report_type": r.report_type,
                "generated_at": r.generated_at.strftime("%d %b %Y, %H:%M"),
                "farm_name": r.farm.farm_name if r.farm else "All Parcels"
            }
            for r in reports[:20]
        ]
        return Response({
            "count": len(results),
            "reports": results
        })
