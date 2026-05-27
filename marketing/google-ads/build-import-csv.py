"""Genera un único CSV importable en Google Ads Editor."""
from __future__ import annotations

import csv
from collections import OrderedDict
from pathlib import Path

BASE = Path(__file__).resolve().parent

CAMPAIGNS = [
    {
        "name": "TBX | Search | Joyas Coronas | LATAM",
        "budget": "18.00",
        "max_cpc": "2.50",
    },
    {
        "name": "TBX | Search | Conquista Competidores | LATAM",
        "budget": "10.00",
        "max_cpc": "3.00",
    },
    {
        "name": "TBX | Search | Lead Magnet Excel | LATAM",
        "budget": "12.00",
        "max_cpc": "1.50",
    },
    {
        "name": "TBX | Search | Rentabilidad BOFU | LATAM",
        "budget": "10.00",
        "max_cpc": "2.50",
    },
    {
        "name": "TBX | Search | Monitor PPC | LATAM",
        "budget": "6.00",
        "max_cpc": "3.50",
    },
]

LOCATIONS = ["Argentina", "Mexico", "Colombia", "Chile", "Peru", "Spain"]


HEADERS = [
    "Campaign",
    "Campaign type",
    "Campaign daily budget",
    "Campaign status",
    "Networks",
    "Languages",
    "Bid strategy type",
    "Location",
    "Ad group",
    "Ad group status",
    "Max CPC",
    "Keyword",
    "Criterion Type",
    "Status",
    "Final URL",
    "Headline 1",
    "Headline 2",
    "Headline 3",
    "Headline 4",
    "Headline 5",
    "Headline 6",
    "Headline 7",
    "Headline 8",
    "Headline 9",
    "Headline 10",
    "Headline 11",
    "Headline 12",
    "Headline 13",
    "Headline 14",
    "Headline 15",
    "Description 1",
    "Description 2",
    "Description 3",
    "Description 4",
    "Path 1",
    "Path 2",
]


def empty_row() -> OrderedDict[str, str]:
    return OrderedDict((h, "") for h in HEADERS)


def read_csv(name: str) -> list[dict[str, str]]:
    path = BASE / name
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main() -> None:
    keywords = read_csv("keywords-import.csv")
    ads = read_csv("responsive-search-ads.csv")
    negatives = [row["Keyword"] for row in read_csv("negative-keywords.csv")]

    rows: list[OrderedDict[str, str]] = []

    campaign_max_cpc = {c["name"]: c["max_cpc"] for c in CAMPAIGNS}

    for campaign in CAMPAIGNS:
        row = empty_row()
        row["Campaign"] = campaign["name"]
        row["Campaign type"] = "Search"
        row["Campaign daily budget"] = campaign["budget"]
        row["Campaign status"] = "Paused"
        row["Networks"] = "Google search"
        row["Languages"] = "es"
        row["Bid strategy type"] = "Maximize clicks"
        rows.append(row)

    for campaign in CAMPAIGNS:
        for location in LOCATIONS:
            row = empty_row()
            row["Campaign"] = campaign["name"]
            row["Location"] = location
            row["Criterion Type"] = "Location"
            rows.append(row)

    ad_groups: set[tuple[str, str]] = set()
    for kw in keywords:
        ad_groups.add((kw["Campaign"], kw["Ad Group"]))

    for campaign_name, ad_group_name in sorted(ad_groups):
        row = empty_row()
        row["Campaign"] = campaign_name
        row["Ad group"] = ad_group_name
        row["Ad group status"] = "Enabled"
        row["Max CPC"] = campaign_max_cpc.get(campaign_name, "2.50")
        rows.append(row)

    for kw in keywords:
        row = empty_row()
        row["Campaign"] = kw["Campaign"]
        row["Ad group"] = kw["Ad Group"]
        row["Keyword"] = kw["Keyword"]
        row["Criterion Type"] = kw["Match Type"]
        row["Max CPC"] = kw["Max CPC"]
        row["Final URL"] = kw["Final URL"]
        row["Status"] = kw["Status"]
        rows.append(row)

    for campaign in CAMPAIGNS:
        for negative in negatives:
            row = empty_row()
            row["Campaign"] = campaign["name"]
            row["Keyword"] = negative
            row["Criterion Type"] = "Campaign negative"
            rows.append(row)

    for ad in ads:
        row = empty_row()
        row["Campaign"] = ad["Campaign"]
        row["Ad group"] = ad["Ad Group"]
        row["Final URL"] = ad["Final URL"]
        row["Status"] = ad["Status"]
        row["Path 1"] = ad["Path 1"]
        row["Path 2"] = ad["Path 2"]
        for i in range(1, 16):
            row[f"Headline {i}"] = ad.get(f"Headline {i}", "")
        for i in range(1, 5):
            row[f"Description {i}"] = ad.get(f"Description {i}", "")
        rows.append(row)

    out = BASE / "taimbox-campanas-import.csv"
    with out.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Written {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()
