from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Max
from .models import MarketPrice, Market
from apps.crops.models import Crop

class MarketPriceListView(APIView):
    """
    List APMC mandi prices with crop, state, and district filters.
    Official data source: AGMARKNET.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        crop_name = request.query_params.get('crop')
        state_name = request.query_params.get('state')
        district_name = request.query_params.get('district')

        qs = MarketPrice.objects.select_related('market', 'crop').all()

        if crop_name:
            qs = qs.filter(crop__name__iexact=crop_name.strip())
        if state_name:
            qs = qs.filter(market__state__iexact=state_name.strip())
        if district_name:
            qs = qs.filter(market__district__iexact=district_name.strip())

        # Filter by latest available price date to maintain full compatibility across PostgreSQL and SQLite
        latest_date = qs.aggregate(m=Max('price_date'))['m']
        if latest_date:
            latest_prices = qs.filter(price_date=latest_date).order_by('-modal_price_rs_per_quintal')[:60]
        else:
            latest_prices = qs[:60]

        return Response({
            "status": "online",
            "source": "AGMARKNET (Government of India Directorate of Marketing & Inspection)",
            "count": len(latest_prices),
            "results": [
                {
                    "id": p.id,
                    "market_id": p.market.id,
                    "mandi": p.market.mandi_name,
                    "state": p.market.state,
                    "district": p.market.district,
                    "crop": p.crop.name,
                    "variety": p.variety,
                    "price_date": p.price_date.strftime('%Y-%m-%d'),
                    "modal_price": float(p.modal_price_rs_per_quintal),
                    "min_price": float(p.min_price_rs_per_quintal),
                    "max_price": float(p.max_price_rs_per_quintal),
                    "arrivals_tonnes": float(p.arrivals_tonnes) if p.arrivals_tonnes else 0.0,
                    "is_sample_data": p.is_sample_data
                } for p in latest_prices
            ]
        })


class MarketPriceCompareView(APIView):
    """Compare prices for a chosen crop across all neighboring mandis."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        crop_name = request.query_params.get('crop', 'Soybean')
        state_name = request.query_params.get('state')

        qs = MarketPrice.objects.filter(crop__name__iexact=crop_name.strip())
        if state_name:
            qs = qs.filter(market__state__iexact=state_name.strip())

        # Latest available date
        latest_date = qs.aggregate(m=Max('price_date'))['m']
        if not latest_date:
            return Response({"error": "No market data found for this crop."}, status=status.HTTP_404_NOT_FOUND)

        prices = qs.filter(price_date=latest_date).select_related('market', 'crop').order_by('-modal_price_rs_per_quintal')

        comparison_data = [
            {
                "mandi": p.market.mandi_name,
                "district": p.market.district,
                "state": p.market.state,
                "modal_price": float(p.modal_price_rs_per_quintal),
                "min_price": float(p.min_price_rs_per_quintal),
                "max_price": float(p.max_price_rs_per_quintal),
                "arrivals_tonnes": float(p.arrivals_tonnes) if p.arrivals_tonnes else 0.0
            } for p in prices
        ]

        # Calculate best market opportunity
        best_market = comparison_data[0] if comparison_data else None

        return Response({
            "crop": crop_name,
            "date": latest_date.strftime('%Y-%m-%d'),
            "best_market_opportunity": best_market,
            "markets_compared_count": len(comparison_data),
            "comparison": comparison_data
        })


class MarketPriceTrendsView(APIView):
    """Historical modal price trends for a crop at a specific mandi."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        crop_name = request.query_params.get('crop', 'Soybean')
        mandi_name = request.query_params.get('mandi', 'Nashik APMC')

        qs = MarketPrice.objects.filter(
            crop__name__iexact=crop_name.strip(),
            market__mandi_name__icontains=mandi_name.strip()
        ).order_by('price_date')[:30]

        return Response({
            "crop": crop_name,
            "mandi": mandi_name,
            "trends": [
                {
                    "date": p.price_date.strftime('%Y-%m-%d'),
                    "modal_price": float(p.modal_price_rs_per_quintal),
                    "min_price": float(p.min_price_rs_per_quintal),
                    "max_price": float(p.max_price_rs_per_quintal)
                } for p in qs
            ]
        })


class GrossRevenueEstimateView(APIView):
    """
    Calculates estimated gross revenue:
    Estimated Gross Revenue = Predicted Production (Tonnes) * 10 (Q/Tonne) * Selected Modal Price (Rs/Q)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        production_tonnes = float(request.data.get('production_tonnes', 1.0))
        modal_price_rs_q = float(request.data.get('modal_price_rs_per_quintal', 4600.0))
        mandi_name = request.data.get('mandi_name', 'Nashik APMC')
        crop_name = request.data.get('crop_name', 'Soybean')

        # 1 Tonne = 10 Quintals
        production_quintals = production_tonnes * 10.0
        gross_revenue_rs = round(production_quintals * modal_price_rs_q, 2)

        return Response({
            "crop": crop_name,
            "mandi": mandi_name,
            "production_tonnes": production_tonnes,
            "production_quintals": production_quintals,
            "modal_price_rs_per_quintal": modal_price_rs_q,
            "estimated_gross_revenue_rs": gross_revenue_rs,
            "formatted_revenue": f"₹{gross_revenue_rs:,.2f}",
            "disclaimer": "Estimated gross revenue is an indicative calculation based on selected APMC modal price; actual market realisations vary with crop grade, moisture content, and auction dynamics."
        }, status=status.HTTP_200_OK)
